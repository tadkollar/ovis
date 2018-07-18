'use strict';

const Logic = require('../logic/logic');

class DataInterface {
    constructor(logger) {
        this._logger = logger;
        this._logic = new Logic(logger);
    }

    async connect(fname) {
        return this._logic.connect(fname);
    }

    disconnect() {
        this._logic.disconnect();
    }

    async updateLayout(layout) {
        return this._logic.updateLayout(layout);
    }

    async;
}

module.exports = DataInterface;
