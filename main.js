'use strict';

/**
 * main.js - All logic for the 'main' process is currently stored in this file
 *
 * NOTE: Logic is contained within this file that uses "process.env.RUNNING_IN_VIS_INDEX_TESTS".
 *  This variable indicates that we're running vis_index tests, which require
 *  that we immediately go to the vis_index page.
 *  While it is bad practice to alter the logic in this file for testing, this is
 *  an unfortunate requirement due to a hanging bug in Spectron that we run into
 *  when we run 'loadURL'. Once that bug is fixed, this logic should be replaced.
 */

const request = require('request');
const path = require('path');
const url = require('url');
const is = require('electron-is');
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

let updateReady = false;
let server = null;
let filename = 'No file selected';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// NOTE: See note at top of file for explanation of "process.env.RUNNING_IN_VIS_INDEX_TESTS"
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
    // NOTE: See note at top of file for explanation of "process.env.RUNNING_IN_VIS_INDEX_TESTS"
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
        openFile(__dirname + '/test/sellar_grouped.db');
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

    loadVisPage();
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
 * Create the menu and load our main window
 */
function startApp() {
    autoUpdater.checkForUpdatesAndNotify();
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    logger.info('Version: ' + app.getVersion());

    mainWindow = new BrowserWindow({});

    // NOTE: See note at top of file for explanation of "process.env.RUNNING_IN_VIS_INDEX_TESTS"
    if (process.env.RUNNING_IN_VIS_INDEX_TESTS) {
        // Immediately load up test DB
        console.log('Running in spectron, running findFile');
        findFile();
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

ipcMain.on('getFilenameFull', (event, arg) => {
    event.sender.send('fullFilenameReply', filename);
});

// Renderer telling main process to install the update
ipcMain.on('installUpdate', (event, arg) => {
    if (updateReady) {
        updateReady = false;
        autoUpdater.quitAndInstall();
    }
});

// Renderer querying if the update is ready
ipcMain.on('checkUpdateReady', (event, arg) => {
    if (updateReady) {
        event.sender.send('updateReady');
    }
});

// Callback when an update is downloaded
autoUpdater.on('update-downloaded', (ev, info) => {
    logger.info('Finished downloading update. Quitting and installing');
    updateReady = true;
    mainWindow.webContents.send('updateReady');
});

autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for updates');
});

autoUpdater.on('update-available', () => {
    logger.info('Update available');
});

autoUpdater.on('error', (ev, err) => {
    logger.error('Error in auto updater');
    logger.error(err.toString());
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
