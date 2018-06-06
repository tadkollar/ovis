'use strict';

const request = require('request');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const url = require('url');
const is = require('electron-is');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const {
    app,
    Menu,
    dialog,
    ipcMain,
    remote,
    BrowserWindow
} = require('electron');

//Logs stored at:
//  Linux:   ~/.config/OVis/log.log
//  OS X:    ~/Library/Logs/OVis/log.log
//  Windows: %USERPROFILE%\AppData\Roaming\OVis\log.log
const logger = require('electron-log');
logger.transports.console.level = 'info';
logger.transports.file.level = 'info';
autoUpdater.logger = logger;

let server = null;
let filename = 'No file selected';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

let index = process.env.RUNNING_IN_VIS_INDEX_TESTS
    ? 'vis_index.html'
    : 'index.html';

const mainWindowUrl = url.format({
    pathname: path.join(__dirname, index),
    protocol: 'file:',
    slashes: true
});

// ******************* Public Methods ******************* //

/**
 * Open the file dialog for users to select their DB
 */
function findFile() {
    if (!process.env.RUNNING_IN_VIS_INDEX_TESTS) {
        logger.info('Opening file dialog');
        dialog.showOpenDialog(mainWindow, null, fileNames => {
            if (fileNames == null || fileNames.length === 0) {
                return;
            }
            openFile(fileNames[0]);
        });
    } else {
        logger.info('Opening sellar grouped in Spectron environment');
        openFile(__dirname + '/server-tests/sellar_grouped.db');
    }
}

/**
 * Request that the server connects to the DB and switch to the visualization
 * page
 *
 * @param {String} fName Name of file to be opened
 */
function openFile(fName) {
    filename = fName;
    if (filename === undefined) {
        logger.info('No file selected');
        return;
    }

    // Send POST to have server connect to DB
    logger.info("Sending 'connect' with: " + filename);
    let loc = { json: { location: filename } };
    request.post('http://127.0.0.1:18403/connect', loc, function(
        error,
        response,
        body
    ) {
        if (error) {
            logger.error('Error connecting to DB: ' + error.toString());
            return;
        }
        logger.info('Connect response: ' + body['Success']);
        loadVisPage();
    });
}

/**
 * Open the visualization HTML file
 */
function loadVisPage() {
    let visInd = path.join(__dirname, 'vis_index.html');

    logger.info('Loading file: ' + visInd);
    mainWindow.loadURL(
        url.format({
            pathname: visInd,
            protocol: 'file:',
            slashes: true
        })
    );
}

/**
 * Spawn the python server
 */
function startServer() {
    // Start up the server
    let server_loc = path.join(__dirname, '../main.py');

    // Use a different path if we're running in Electron
    if (is.dev()) {
        logger.info('Running in Electron');
        server_loc = path.join(__dirname, 'main.py');
    } else {
        logger.info('Running outside of Electron');
    }
    server = spawn('python', [server_loc]);

    // Redirect stdout
    server.stdout.on('data', function(data) {
        logger.info('SERVER: ' + data);
    });

    // Redirect stderr
    server.stderr.on('data', function(data) {
        logger.info('SERVER: ' + data);
    });
}

/**
 * Create the menu and load our main window
 */
function startApp() {
    autoUpdater.checkForUpdatesAndNotify();
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    logger.info('Version: ' + app.getVersion());

    mainWindow = new BrowserWindow({});

    // Start the server
    startServer();
    if (process.env.RUNNING_IN_VIS_INDEX_TESTS) {
        // If we're running a test, block process for a time so the server can start
        let waitTill = new Date(new Date().getTime() + 1000);
        while (waitTill > new Date()) {}

        // Immediately load up the test DB
        console.log('Running in spectron, running findFile');
        findFile();

        // Wait for connect
        waitTill = new Date(new Date().getTime() + 1000);
        while (waitTill > new Date()) {}
    }
    mainWindow.loadURL(mainWindowUrl);
}

// ******************* Events ******************* //

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On will-quit we'll close the server
app.on('will-quit', function() {
    server.stdin.pause();
    server.stderr.pause();
    server.stdout.pause();
    server.kill();
});

// On openFile open up file dialog
ipcMain.on('openFile', (event, arg) => {
    logger.info('Received IPC in main to open file');
    findFile();
});

// on getFilename send 'filenameReply' with the filename
ipcMain.on('getFilename', (event, arg) => {
    let fns = filename.split('\\');
    if (fns.length == 1) {
        fns = filename.split('/');
    }

    event.sender.send('filenameReply', fns[fns.length - 1]);
});

// Callback when an update is downloaded
autoUpdater.on('update-downloaded', (ev, info) => {
    logger.info('Finished downloading update. Quitting and installing');
    autoUpdater.quitAndInstall();
});

app.on('ready', startApp);

// ******************* Template Definitions ******************* //

// Toolbar template
const template = [
    {
        label: 'File',
        submenu: [
            {
                role: 'open',
                label: 'Open',
                accelerator: 'CmdOrCtrl+o',
                click() {
                    findFile();
                }
            },
            {
                role: 'quit',
                label: 'Quit',
                accelerator: 'CmdOrCtrl+q',
                click() {
                    let w = remote.getCurrentWindow();
                    w.close();
                }
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                accelerator: 'CmdOrCtrl+Shift+i',
                role: 'toggle dev tools',
                label: 'Toggle Developer Tools',
                click() {
                    mainWindow.webContents.openDevTools();
                }
            },
            {
                accelerator: 'CmdOrCtrl+r',
                role: 'refresh',
                label: 'Refresh Page',
                click() {
                    mainWindow.webContents.reloadIgnoringCache();
                }
            }
        ]
    }
];
