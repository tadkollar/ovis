'use strict';

var { ipcRenderer } = require('electron');

/**
 * Class IPC - Handles render-side communications between the main and render process
 */
function IPC() {
    let filenameCallback = null;
    let metadataCallback = null;
    let layoutCallback = null;
    let driverIterationCallback = null;
    let driverIterationCountCallback = null;
    let modelViewerDataCallback = null;
    let allDriverVarsCallback = null;

    /**
     * Send an IPC message to the main process to
     *  open the file epxlorer
     */
    this.openFile = function() {
        ipcRenderer.sendSync('openFile');
        console.log('Sent openFile IPC message');
    };

    /**
     * Set the filename callback and sends 'getFilename' to the main process
     *
     * @param {function} callback
     */
    this.getFilename = function(callback) {
        filenameCallback = callback;
        ipcRenderer.send('getFilename');
    };

    /**
     * Tell main process to install newest update
     */
    this.installUpdate = function() {
        ipcRenderer.send('installUpdate');
    };

    this.getMetadata = function(callback, error) {
        metadataCallback = callback;
        ipcRenderer.send('getMetadata');
    };

    this.updateLayout = function(layout) {
        ipcRenderer.send('updateLayout', layout);
    };

    this.getLayout = function(callback, error) {
        layoutCallback = callback;
        ipcRenderer.send('getLayout');
    };

    this.getDriverIterationData = function(variable, callback, error) {
        driverIterationCallback = callback;
        ipcRenderer.send('getDriverIterationData', variable);
    };

    this.getDriverIterationCount = function(variable, count, callback, error) {
        driverIterationCountCallback = callback;
        ipcRenderer.send('getDriverIterationsBasedOnCount', variable, count);
    };

    this.getModelViewerData = function(callback, error) {
        modelViewerDataCallback = callback;
        ipcRenderer.send('getModelViewerData');
    };

    this.getAllDriverVars = function(callback, error) {
        allDriverVarsCallback = callback;
        ipcRenderer.send('getAllDriverVars');
    };

    // ********************** Callbacks ********************** \\

    //Call the filename callback, if it exists
    ipcRenderer.on('filenameReply', (event, arg) => {
        if (filenameCallback != null) {
            filenameCallback(arg);
        }

        filenameCallback = null;
    });

    ipcRenderer.on('metadataReply', (event, arg) => {
        if (metadataCallback != null) {
            metadataCallback(arg);
        }
    });

    ipcRenderer.on('layoutReply', (event, arg) => {
        if (layoutCallback != null) {
            layoutCallback(arg);
        }
    });

    ipcRenderer.on('driverIterationReply', (event, arg) => {
        if (driverIterationCallback != null) {
            driverIterationCallback(arg);
        }
    });

    ipcRenderer.on('driverIterationCountReply', (event, arg) => {
        if (driverIterationCountCallback != null) {
            driverIterationCountCallback(arg);
        }
    });

    ipcRenderer.on('modelViewerDataReply', (event, arg) => {
        if (modelViewerDataCallback != null) {
            modelViewerDataCallback(arg);
        }
    });

    ipcRenderer.on('allDriverVarsReply', (event, arg) => {
        if (allDriverVarsCallback != null) {
            allDriverVarsCallback(arg);
        }
    });

    ipcRenderer.on('updateReady', () => {
        document.getElementById('installButton').style.display = 'block';
    });

    // Check if we're ready to update every 5 seconds
    setInterval(() => {
        ipcRenderer.send('checkUpdateReady');
    }, 5000);
}

var ipc = new IPC();
