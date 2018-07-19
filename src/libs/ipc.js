'use strict';

var { ipcRenderer } = require('electron');

/**
 * Class IPC - Handles render-side communications between the main and render process
 */
function IPC() {
    let filenameCallback = null;
    let filenameFullCallback = null;

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

    this.getFilenameFull = function(callback, error) {
        filenameFullCallback = callback;
        ipcRenderer.send('getFilenameFull');
    };

    // ********************** Callbacks ********************** \\

    //Call the filename callback, if it exists
    ipcRenderer.on('filenameReply', (event, arg) => {
        if (filenameCallback != null) {
            filenameCallback(arg);
        }

        filenameCallback = null;
    });

    ipcRenderer.on('updateReady', () => {
        document.getElementById('installButton').style.display = 'block';
    });

    ipcRenderer.on('fullFilenameReply', (event, arg) => {
        if (filenameFullCallback != null) {
            filenameFullCallback(arg);
        }
    });

    // Check if we're ready to update every 5 seconds
    setInterval(() => {
        ipcRenderer.send('checkUpdateReady');
    }, 5000);
}

var ipc = new IPC();
