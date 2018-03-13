'use strict'

const electron = require('electron')
const spawn = require('child_process').spawn
const request = require('request')
const querystring = require('querystring')
const logger = require('electron-log');
const fs = require('fs')

// Module to control application life.
const { app, Menu } = require('electron')

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const dialog = require('electron').dialog
const ipcMain = require('electron').ipcMain

const path = require('path')
const url = require('url')

let filename = 'No File Selected'
var py = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

const mainWindowUrl = url.format({
  pathname: path.join(__dirname, "need_load.html"),
  protocol: "file:",
  slashes: true
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
    mainWindow.maximize();
  }
})

app.on('will-quit', function () {
  py.stdin.pause();
  py.stderr.pause();
  py.stdout.pause();
  py.kill();
})

function findFile() {
  dialog.showOpenDialog((fileNames) => {
    openFile(fileNames);
  })
}

function openFile(fileNames) {
  if (fileNames === undefined) {
    logger.info("No file selected");
    return;
  }

  logger.info("Sending 'connect' with: " + fileNames[0])

  request.post('http://127.0.0.1:18403/connect',
    { json: { 'location': fileNames[0] } },
    function (error, response, body) {
      if (error) {
        logger.error("ERROR: " + error.toString())
        return;
      }
      logger.info("Connected to DB");
    });

  filename = fileNames[0]
  mainWindow.webContents.send('connect', fileNames)
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}

ipcMain.on('openFile', (event, arg) => {
  mainWindow.webContents.send('test', ['blah'])
  findFile();
  logger.info('Opening file')
  mainWindow.webContents.send('test')
});

ipcMain.on('getFilename', (event, arg) => {
  let fns = filename.split('\\');
  event.sender.send('filenameReply', fns[fns.length - 1]);
});

function startServer() {
  let resourceLocation = process.resourcesPath;
  py = spawn('python', [resourceLocation + '/main.py'])
  py.stdout.on('data', function (data) {
    logger.info("STDOUT: " + data);
  })
  py.stderr.on('data', function (data) {
    logger.error("ERROR: " + data)
  })
}

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
          const remote = require('electron').remote
          let w = remote.getCurrentWindow()
          w.close()
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
        click() { mainWindow.webContents.openDevTools(); }
      },
      {
        accelerator: 'CmdOrCtrl+r',
        role: 'refresh',
        label: 'Refresh Page',
        click() { mainWindow.webContents.reloadIgnoringCache(); }
      }
    ]
  }
]

const onAppReady = () => {
  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow = new BrowserWindow({});
  mainWindow.loadURL(mainWindowUrl);
};

app.on("ready", onAppReady);

//Start the server
startServer()