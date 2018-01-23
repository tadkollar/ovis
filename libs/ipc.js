'use strict'

var {ipcRenderer, remote} = require('electron')

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

function connect(url) {
    console.log("Received connect");

    //Send a POST to connect to the DB
    http.post("connect", {'location': url}, (response) => {
        if(response['Success']) {
            console.log("Opened connection with DB");
        }
        else {
            console.log("Failed to open file");
            //Report to user
        }
    });
}

ipcRenderer.on('test', function(event, data) {
    console.log("Test working on client")
})
