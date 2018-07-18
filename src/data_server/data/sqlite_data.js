'use strict';

const Data = require('../data/data');
const sqlite3 = require('sqlite3');

/**
 * class SqliteData - data layer that can read SQLite OpenMDAO recorded databases.
 */
class SqliteData extends Data {
    /**
     * Connect to DB with the given filename
     *
     * @param {string} filename location of DB
     * @returns {Promise} resolve if successful, reject otherwise
     */
    async connect(filename) {
        this._logger.info('Connecting to DB at: ' + filename);
        this._abs2prom = null;
        this._prom2abs = null;
        this._abs2meta = null;
        let self = this; // because 'this' will have different value in Promise

        return new Promise(function(resolve, reject) {
            // attempt to connect to DB
            self._db = new sqlite3.Database(
                filename,
                sqlite3.OPEN_READWRITE,
                err => {
                    if (err === null) {
                        // create 'layouts' table if it doesn't already exist
                        self._createLayoutTableIfNecessary();
                        // gather metadata
                        self.getMetadata()
                            .then(metadata => {
                                self._abs2prom = metadata['abs2prom'];
                                self._prom2abs = metadata['prom2abs'];
                                self._abs2meta = metadata['abs2meta'];
                                resolve();
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        self._db = null;
                        reject('Could not connect to DB');
                    }
                }
            );
        });
    }

    /**
     * Disconnect from the database
     */
    disconnect() {
        this._logger.info('Disconnecting from database');
        if (this._db !== null) {
            this._db.close();
        }
        this._db = null;
    }

    /**
     * Get abs2meta, abs2prom and prom2abs data from database
     *
     * @returns {Promise} abs2prom and prom2abs metadata
     */
    async getMetadata() {
        this._logger.info('Getting metadata from DB');
        let self = this;

        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.info('No DB connection - cannot get metadata');
                reject('Not connected to a database');
                return;
            }

            // query to get abs2prom and prom2abs
            self._db.get(
                'SELECT abs2prom, prom2abs, abs2meta FROM metadata',
                (err, row) => {
                    // error handling
                    if (err) {
                        reject(err);
                        return;
                    }

                    // return object with abs2prom and prom2abs
                    if (row !== null) {
                        resolve({
                            abs2prom: JSON.parse(row['abs2prom']),
                            prom2abs: JSON.parse(row['prom2abs']),
                            abs2meta: JSON.parse(row['abs2meta'])
                        });
                        return;
                    }
                    resolve(null);
                }
            );
        });
    }

    /**
     * Get all driver iteration data
     *
     * @returns {Promise} array of driver iteration data as JSON
     */
    async getDriverIterationData() {
        this._logger.info('Getting driver iteration');
        let self = this;

        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.error(
                    'No DB connection - cannot get driver iteration'
                );
                reject('Not connected to a database');
                return;
            }

            self._db.all('SELECT * FROM driver_iterations', (err, rows) => {
                if (err !== null) {
                    reject(err);
                    return;
                }

                resolve(self._extractDriverIterationData(self, rows));
            });
        });
    }

    /**
     * Get the model viewer data.
     *
     * @returns {Promise} resolves to model data
     */
    async getModelViewerData() {
        let self = this;
        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.error(
                    'No DB connection - cannot get model viewer data'
                );
                reject('Not connected to a database');
                return;
            }

            self._db.get(
                'SELECT model_viewer_data FROM driver_metadata',
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row != null) {
                        resolve([
                            {
                                model_viewer_data: JSON.parse(
                                    row['model_viewer_data']
                                )
                            }
                        ]);
                        return;
                    }
                    resolve([]);
                }
            );
        });
    }

    /**
     * Get layout as string
     *
     * @returns {Promise} layout as JSON string
     */
    async getLayout() {
        this._logger.info('Getting layout from DB');
        let self = this; // because 'this' will have different value in Promise

        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.error('No DB connection - cannot get layout');
                reject('Not connected to a database');
                return;
            }

            // query to get the layout
            self._db.get(
                'SELECT layout from layouts where id=0',
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row != null) {
                        resolve([JSON.parse(row['layout'])]);
                        return;
                    }
                    resolve([]);
                }
            );
        });
    }

    /**
     * Store new layout in database
     *
     * @param {string} layout
     * @returns {Promise}
     */
    async updateLayout(layout) {
        this._logger.info('Updating layout');
        let self = this;
        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.error('No DB connection - cannot update layout');
                reject('Not connected to a database');
                return;
            }

            self._db.run('INSERT OR REPLACE INTO layouts VALUES (?,?)', [
                0,
                layout
            ]);
            resolve();
        });
    }

    /**
     * Determine if there are iterations with an 'iteration count' higher
     * than the count given
     *
     * @param {number} count
     * @returns {Promise} true if new, false otherwise
     */
    async isNewDriverIterationData(count) {
        let self = this;
        return new Promise(function(resolve, reject) {
            if (self._db === null) {
                self._logger.error(
                    'No DB connection - cannot get new driver iterations'
                );
                reject('Not connected to a database');
                return;
            }

            self._db.all(
                'SELECT counter FROM driver_iterations where counter > ' +
                    count.toString(),
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (rows.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            );
        });
    }

    /**
     * Add the 'layout' table to the SQLite DB if it doesn't already exist.
     */
    _createLayoutTableIfNecessary() {
        if (this._db === null) {
            this._logger.error(
                'Trying to create layout table when database is null'
            );
            return;
        }

        this._db.run(
            'create table if not exists layouts (id integer PRIMARY KEY, layout TEXT)'
        );
    }

    /**
     * Extract data from all rows of driver iterations
     *
     * @param {[JSON]} rows
     * @return {*} extracted data
     */
    _extractDriverIterationData(self, rows) {
        let cleaned_rows = [];
        for (let i = 0; i < rows.length; ++i) {
            let row = rows[i];
            cleaned_rows.push({
                iteration_coordinate: row['iteration_coordinate'],
                inputs: JSON.parse(row['inputs']),
                outputs: JSON.parse(row['outputs']),
                counter: row['counter']
            });
        }

        let ret = [];
        for (let cr = 0; cr < cleaned_rows.length; ++cr) {
            let desvars_arr = [];
            let objectives_arr = [];
            let constraints_arr = [];
            let sysincludes_arr = [];
            let inputs_arr = [];
            let row = cleaned_rows[cr];

            for (
                let nameInd = 0;
                nameInd < Object.keys(row['outputs']).length;
                ++nameInd
            ) {
                let name = Object.keys(row['outputs'])[nameInd];
                let types = self._abs2meta[name]['type'];

                if (types.includes('desvar')) {
                    desvars_arr.push({
                        name: name,
                        values: row['outputs'][name]
                    });
                } else if (types.includes('objective')) {
                    objectives_arr.push({
                        name: name,
                        values: row['outputs'][name]
                    });
                } else if (types.includes('constraint')) {
                    constraints_arr.push({
                        name: name,
                        values: row['outputs'][name]
                    });
                } else {
                    sysincludes_arr.push({
                        name: name,
                        values: row['outputs'][name]
                    });
                }
            }

            for (
                let nameInd = 0;
                nameInd < Object.keys(row['inputs']).length;
                ++nameInd
            ) {
                let name = Object.keys(row['inputs'])[nameInd];
                inputs_arr.push({
                    name: name,
                    values: row['inputs'][name]
                });
            }

            ret.push({
                iteration_coordinate: row['iteration_coordinate'],
                counter: row['counter'],
                desvars: desvars_arr,
                objectives: objectives_arr,
                constraints: constraints_arr,
                sysincludes: sysincludes_arr,
                inputs: inputs_arr
            });
        }

        return ret;
    }
}

module.exports = SqliteData;
