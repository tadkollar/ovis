'use strict';

/**
 * class Data - abstract class
 *
 * Methods that all database data layer readers types must implement.
 */
class Data {
    constructor(logger) {
        this._logger = logger;
        this._db = null;
    }

    /**
     * Connect to DB with the given filename
     *
     * @param {string} filename location of DB
     * @returns {Promise} resolve if successful, reject otherwise
     */
    async connect(filename) {
        throw new Error('Running connect from parent Data class');
    }

    /**
     * Disconnect from the database
     */
    disconnect() {
        throw new Error('Running disconnect from parent Data class');
    }

    /**
     * Get abs2prom and prom2abs data from database
     *
     * @returns {Promise} abs2prom and prom2abs metadata
     */
    async getMetadata() {
        throw new Error('Running getMetadata from parent Data class');
    }

    /**
     * Get all driver iteration data
     *
     * @returns {Promise} array of driver iteration data as JSON
     */
    async getDriverIterationData() {
        throw new Error(
            'Running getDriverIterationData from parent Data class'
        );
    }

    /**
     * Get the model viewer data.
     *
     * @returns {Promise} resolves to model data
     */
    async getModelViewerData() {
        throw new Error('Running getModelViewerData from parent Data class');
    }

    /**
     * Get layout as string
     *
     * @returns {Promise} layout as JSON string
     */
    async getLayout() {
        throw new Error('Running getLayout from parent Data class');
    }

    /**
     * Store new layout in database
     *
     * @param {string} layout
     * @returns {Promise}
     */
    async updateLayout(layout) {
        throw new Error('Running updateLayout from parent Data class');
    }

    /**
     * Determine if there are iterations with an 'iteration count' higher
     * than the count given
     *
     * @param {number} count
     * @returns {Promise} true if new, false otherwise
     */
    async isNewDriverIterationData(count) {
        throw new Error(
            'Running isNewDriverIterationData from parent Data class'
        );
    }
}

module.exports = Data;
