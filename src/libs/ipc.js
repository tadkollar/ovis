'use strict';

var { ipcRenderer, remote } = require('electron');

/**
 * Class IPC - Handles render-side communications between the main and render process
 */
function IPC() {
    let filenameCallback = null;

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

    //Call the filename callback, if it exists
    ipcRenderer.on('filenameReply', (event, arg) => {
        if (filenameCallback != null) {
            filenameCallback(arg);
        }

        filenameCallback = null;
    });
}

var ipc = new IPC();
