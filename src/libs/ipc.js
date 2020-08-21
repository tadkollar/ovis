'use strict';

var { ipcRenderer } = require('electron');

/**
 * Class IPC - Handles render-side communications between the main and render process
 */
class IPC {
    constructor() {
        this.filenameCallback = null;
        this.filenameFullCallback = null;

        const self = this;

        // ********************** Callbacks ********************** \\

        //Call the filename callback, if it exists
        ipcRenderer.on('filenameReply', (event, arg) => {
            if (self.filenameCallback != null) {
                self.filenameCallback(arg);
            }

            self.filenameCallback = null;
        });

        ipcRenderer.on('updateReady', () => {
            document.getElementById('installButton').style.display = 'block';
        });

        ipcRenderer.on('fullFilenameReply', (event, arg) => {
            if (self.filenameFullCallback != null) {
                self.filenameFullCallback(arg);
            }
        });

        // Check if we're ready to update every 5 seconds
        setInterval(() => {
            ipcRenderer.send('checkUpdateReady');
        }, 5000);
    }

    /**
     * Send an IPC message to the main process to
     *  open the file epxlorer
     */
    openFile() {
        ipcRenderer.sendSync('openFile');
        console.log('Sent openFile IPC message');
    }

    /**
     * Set the filename callback and sends 'getFilename' to the main process
     *
     * @param {function} callback
     */
    getFilename(callback) {
        this.filenameCallback = callback;
        ipcRenderer.send('getFilename');
    };

    /**
     * Tell main process to install newest update
     */
    installUpdate() {
        ipcRenderer.send('installUpdate');
    };

    getFilenameFull(callback, error) {
        this.filenameFullCallback = callback;
        ipcRenderer.send('getFilenameFull');
    };
}

var ipc = new IPC();
