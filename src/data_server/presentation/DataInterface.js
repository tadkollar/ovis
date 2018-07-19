'use strict';

const Logic = require('../logic/logic');

class DataInterface {
    constructor(logger) {
        this._logger = logger;
        this._logic = new Logic(logger);
    }

    /**
     * Connect to DB with the given filename
     *
     * @param {string} fname
     * @returns {Promise}
     */
    async connect(fname) {
        return this._logic.connect(fname);
    }

    /**
     * Disconnect from the database
     */
    disconnect() {
        this._logic.disconnect();
    }

    /**
     * Store this layout as the current layout
     *
     * @param {*} layout
     * @returns {Promise}
     */
    async updateLayout(layout) {
        return this._logic.updateLayout(layout);
    }

    /**
     * Get the current layout
     *
     * @returns {Promise}
     */
    async getLayout() {
        return this._logic.getLayout();
    }

    /**
     * Get abs2meta, abs2prom and prom2abs from database
     *
     * @returns {Promise} resolves to metadata
     */
    async getMetadata() {
        return this._logic.getMetadata();
    }

    /**
     * Get all driver iteration data for a given variable
     *
     * @param {string} variable
     * @returns {Promise} resolves to iteration data
     */
    async getDriverIterationData(variable) {
        return this._logger.getDriverIterationData(variable);
    }

    /**
     * Get model viewer data
     *
     * @returns {Promise} resolves to model viewer data
     */
    async getModelViewerData() {
        return this._logic.getModelViewerData();
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
        return this._logic.getDriverIterationsBasedOnCount(variable, count);
    }

    /**
     * Get the set of all variables recorded
     *
     * @returns {Promise}
     */
    async getAllDriverVars() {
        return this._logic.getAllDriverVars();
    }
}

module.exports = DataInterface;
