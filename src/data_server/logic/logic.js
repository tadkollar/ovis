'use strict';

const SqliteData = require('../data/sqlite_data');

class Logic {
    constructor(logger) {
        this._logger = logger;
        this._data = new SqliteData(logger);
    }

    /**
     * Connect to DB with the given filename
     *
     * @param {string} fname
     * @returns {Promise}
     */
    async connect(fname) {
        return this._data.connect(fname);
    }

    /**
     * Disconnect from the database
     */
    disconnect() {
        if (this._data != null) {
            this._data.disconnect();
        }
    }

    /**
     * Store this layout as the current layout
     *
     * @param {*} layout
     * @returns {Promise}
     */
    async updateLayout(layout) {
        return this._data.updateLayout(JSON.stringify(layout));
    }

    /**
     * Get the current layout
     *
     * @returns {Promise}
     */
    async getLayout() {
        return this._data.getLayout();
    }

    /**
     * Get abs2meta, abs2prom and prom2abs from database
     *
     * @returns {Promise} resolves to metadata
     */
    async getMetadata() {
        let n_abs2prom = { input: {}, output: {} };
        let n_prom2abs = { input: {}, output: {} };

        let ret = await this._data.getMetadata();
        if (ret != null && ret.hasOwnProperty('abs2prom')) {
            let io = ['input', 'output'];
            for (let i = 0; i < io.length; ++i) {
                let inp_out = io[i];
                for (
                    let j = 0;
                    j < Object.keys(ret['abs2prom'][inp_out]).length;
                    ++j
                ) {
                    let v = Object.keys(ret['abs2prom'][inp_out])[j];
                    let n_k = v.replace('___', '.');
                    n_abs2prom[inp_out][n_k] = ret['abs2prom'][inp_out][v];
                }
                for (
                    let j = 0;
                    j < Object.keys(ret['prom2abs'][inp_out]).length;
                    ++j
                ) {
                    let v = Object.keys(ret['prom2abs'][inp_out])[j];
                    let n_k = v.replace('___', '.');
                    n_prom2abs[inp_out][n_k] = ret['prom2abs'][inp_out][v];
                }
            }

            return { abs2prom: n_abs2prom, prom2abs: n_prom2abs };
        } else {
            this._logger.warn(
                'Trouble getting metadata. Error: ' + ret.toString()
            );
            return {};
        }
    }

    /**
     * Get all driver iteration data for a given variable
     *
     * @param {string} variable
     * @returns {Promise} resolves to iteration data
     */
    async getDriverIterationData(variable) {
        let self = this;
        let dat = await this._data.getDriverIterationData();
        let ret = [];
        dat.forEach(i => {
            i['desvars'].forEach(v => {
                if (v['name'] === variable) {
                    v['iteration'] = self._exractIterationCoordinate(
                        i['iteration_coordinate']
                    );
                    v['counter'] = i['counter'];
                    v['type'] = 'desvar';
                    ret.push(v);
                }
            });
            i['objectives'].forEach(v => {
                if (v['name'] === variable) {
                    v['iteration'] = self._exractIterationCoordinate(
                        i['iteration_coordinate']
                    );
                    v['counter'] = i['counter'];
                    v['type'] = 'objective';
                    ret.push(v);
                }
            });
            i['constraints'].forEach(v => {
                if (v['name'] === variable) {
                    v['iteration'] = self._exractIterationCoordinate(
                        i['iteration_coordinate']
                    );
                    v['counter'] = i['counter'];
                    v['type'] = 'constraint';
                    ret.push(v);
                }
            });
            i['sysincludes'].forEach(v => {
                if (v['name'] === variable) {
                    v['iteration'] = self._exractIterationCoordinate(
                        i['iteration_coordinate']
                    );
                    v['counter'] = i['counter'];
                    v['type'] = 'sysinclude';
                    ret.push(v);
                }
            });
            i['inputs'].forEach(v => {
                if (v['name'] === variable) {
                    v['iteration'] = self._exractIterationCoordinate(
                        i['iteration_coordinate']
                    );
                    v['counter'] = i['counter'];
                    v['type'] = 'input';
                    ret.push(v);
                }
            });
        });

        return ret;
    }

    /**
     * Get model viewer data
     *
     * @returns {Promise} resolves to model viewer data
     */
    async getModelViewerData() {
        return this._data.getModelViewerData();
    }

    /**
     * Get driver iteration data for a given variable if
     * new data is available based on the count given
     *
     * @param {string} variable variable name
     * @param {number} count highest current count
     * @returns {Promise}
     */
    async getDriverIterationsBasedOnCount(variable, count) {
        let ret = await this._data.isNewDriverIterationData(count);
        if (ret === true) {
            return this.getDriverIterationData(variable);
        }

        return [];
    }

    /**
     * Get the set of all variables recorded
     *
     * @returns {Promise}
     */
    async getAllDriverVars() {
        let dat = [];
        let ret = {
            desvars: [],
            objectives: [],
            constraints: [],
            sysincludes: [],
            inputs: []
        };

        try {
            dat = await this._data.getDriverIterationData();
        } catch (e) {
            return ret;
        }

        let cache = [];
        let self = this;
        dat.forEach(i => {
            i['desvars'].forEach(v => {
                let name = v['name'];
                if (!cache.includes(name)) {
                    ret.desvars.push(name);
                    cache.push(name);
                }
            });
            i['objectives'].forEach(v => {
                let name = v['name'];
                if (!cache.includes(name)) {
                    ret.objectives.push(name);
                    cache.push(name);
                }
            });
            i['constraints'].forEach(v => {
                let name = v['name'];
                if (!cache.includes(name)) {
                    ret.constraints.push(name);
                    cache.push(name);
                }
            });
            i['sysincludes'].forEach(v => {
                let name = v['name'];
                if (!cache.includes(name)) {
                    ret.sysincludes.push(name);
                    cache.push(name);
                }
            });
            i['inputs'].forEach(v => {
                let name = v['name'];
                if (!cache.includes(name)) {
                    ret.inputs.push(name);
                    cache.push(name);
                }
            });
        });

        return ret;
    }

    _exractIterationCoordinate(coord) {
        let delimiter = '|';
        let ret = [];

        let splitCoord = coord.split(delimiter);
        let i = 0;
        while (i < splitCoord.length) {
            let node = {
                name: splitCoord[i],
                iteration: splitCoord[i + 1]
            };
            ret.push(node);
            i += 2;
        }

        return ret;
    }
}

module.exports = Logic;
