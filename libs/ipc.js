'use strict'

var { ipcRenderer, remote } = require('electron')
let filenameCallback = null;

/**
* function openFile - Sends an IPC message to the main process to
*   open the file epxlorer
*/
function openFile() {
    ipcRenderer.sendSync('openFile');
    console.log("Sent openFile IPC message");
}

/**
 * Sets the filename callback and sends 'getFilename' to the renderer
 * 
 * @param {Method} callback 
 */
function getFilename(callback) {
    filenameCallback = callback;
    ipcRenderer.send('getFilename');
}

//Call the filename callback, if it exists
ipcRenderer.on('filenameReply', (event, arg) => {
    if (filenameCallback != null) {
        filenameCallback(arg);
    }

    filenameCallback = null;
})