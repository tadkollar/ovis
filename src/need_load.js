const ipcRenderer = require('electron').ipcRenderer;

function openFile() {
    ipcRenderer.sendSync('openFile');
}

ipcRenderer.on('connect', (event, message) => {
    http.post("connect", {'location': message[0]}, (response) => {
        if(response['Success']) {
            console.log("Opened connection with DB");
            //Load up window
        }
        else {
            console.log("Failed to open file");
            //Report to user
        }
    });
});