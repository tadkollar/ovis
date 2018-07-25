# OVis: OpenMDAO Visualization
------------------------------

OVis is a desktop application that allows you to visualize the
data you've recorded using OpenMDAO's SQLite recorder. To use,
simply open OVis, select your SQLite database file, and use the
N<sup>2</sup> diagram to look at your model hierarchy and plots
to see iteration history.

### Install

OVis is available for Windows, Mac, and Ubuntu.

1. Go to the OVis's [releases](https://github.com/OpenMDAO/Zune/releases)
and download the correct installer for your operating system from the most
recent release.

    * For Windows: `OVis.Setup.x.y.z.exe`
    * For Mac: `OVis-x.y.z.dmg`
    * For Ubuntu: `OVis-x.y.z-x86_64.AppImage`

2. Once downloaded, double-click to run the installer. Note that,
for Windows, we do not yet sign the installer. As a result,
opening the file will likely result in a "Windows protected your
PC" popup. Click "_More info_" then "_Run anyway_" to proceed with
installation.

3. Follow the installer's instructions. Once complete, you
should be able to run the OVis executable.

## Development

OVis is written in a combination of Node.js, JavaScript,
HTML, and CSS using the Electron framework. Testing uses
Mocha, Chai, and Spectron with babel-node
and isparta for code coverage. To begin developing OVis:

1. Install [Node.js and npm](https://nodejs.org/en/download/package-manager/)
2. Run `git clone https://github.com/OpenMDAO/zune.git`
3. Go to the cloned folder with `cd zune`
4. Run `npm install` to install all application dependencies.
    * **Note:** I've noticed there can be problems installing the
    _sqlite3_ library on macOS. If you run into this problem, try
    running the command again with Python 2 active.

If all goes well, you should now be able to start OVis with `npm
start`.

### Architecture

Electron applications run in [two processes](https://electronjs.org/docs/tutorial/application-architecture):
the **main** process and the **renderer** process, with
communication between these being performed
using a built-in IPC module. For OVis, the entirety of the logic for
the main process can be found in _main.js_, which is responsible for
application startup, file selection, and automatic updating.

### Test

### Build and Updating

