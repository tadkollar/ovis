'use strict';

//Logs stored at:
//  Linux:   ~/.config/OVis/log.log
//  OS X:    ~/Library/Logs/OVis/log.log
//  Windows: %USERPROFILE%\AppData\Roaming\OVis\log.log
const logger = require('electron-log');
// NOTE: this require is relative to vis_index.html
const DataInterface = require('./src/data_server/presentation/DataInterface');

/**
 * Class Server - series of functions to interface with the data server
 *
 * NOTE: It may seem most intuitive to keep connection
 * to the server in the Main process and then communicate
 * via IPC; however, this leads to ulta-convoluted code
 * because IPCs cannot directly respond with data,
 * but call response IPCs.
 */
function Server() {
    let self = this;
    self.connected = false;

    ipc.getFilenameFull(name => {
        self.dataInterface = new DataInterface(logger);
        self.dataInterface.connect(name).then(() => {
            self.connected = true;
        });
    });

    /**
     * Get abs2prom and prom2abs metadata from the server
     *
     * @returns {Promise} resolves to {'abs2prom':..., 'prom2abs':...}
     */
    this.getMetadata = async function() {
        return self.dataInterface.getMetadata();
    };

    /**
     * Get the set names of variables for which we have data
     */
    this.getVars = async function() {
        return self.dataInterface.getAllDriverVars();
    };

    /**
     * Get the data for a given variable. If maxCount is given then data
     * will only be returned for iterations > maxCount
     *
     * @param {String} name - the variable name
     * @param {Number} maxCount - the current max iteration count, if you only want newest data
     */
    this.getVariable_DriverIteration = async function(name, maxCount = -1) {
        if (maxCount >= 0) {
            return self.dataInterface.getDriverIterationsBasedOnCount(
                name,
                maxCount
            );
        } else {
            return self.dataInterface.getDriverIterationData(name);
        }
    };

    /**
     * Get the layout from the server
     *
     */
    this.getLayout = async function() {
        return self.dataInterface.getLayout();
    };

    /**
     * Get the driver metadata from the server
     *
     */
    this.getDriverMetadata = async function() {
        return new Promise(function(resolve, reject) {
            self.dataInterface.getModelViewerData().then(data => {
                resolve(data[0]);
            });
        });
    };

    /**
     * Save the given layout
     *
     * @param {JSON} layout - the layout to be saved
     */
    this.saveLayout = function(layout) {
        let state = JSON.stringify(layout);
        self.dataInterface.updateLayout({ layout: state });
    };
}

const server = new Server();
