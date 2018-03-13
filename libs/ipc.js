'use strict'

var {ipcRenderer, remote} = require('electron')
let filenameCallback = null;

/**
* function openFile - Sends an IPC message to the main process to
*   open the file epxlorer
*/
function openFile() {
    ipcRenderer.sendSync('openFile');
}

//Listen for the 'connect' IPC call from the main process.
ipcRenderer.on('connect', (event, message) => {
    connect(message[0])
});

/**
 * Sends the CONNECT signal to the server via a POST request.
 * 
 * @param {String} url 
 */
function connect(url) {
    console.log("Received connect");

    //Send a POST to connect to the DB
    http.post("connect", {'location': url}, (response) => {
        if(response['Success']) {
            console.log("Opened connection with DB");
        }
        else {
            console.log("Failed to open file");
        }
    });
}

//Call the filename callback, if it exists
ipcRenderer.on('filenameReply', (event, arg) => {
    if(filenameCallback != null) {
        filenameCallback(arg);
    }

    filenameCallback = null;
})

/**
 * Sets the filename callback and sends 'getFilename' to the renderer
 * 
 * @param {Method} callback 
 */
function getFilename(callback) {
    filenameCallback = callback;
    ipcRenderer.send('getFilename');
}