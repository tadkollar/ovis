const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const electron = require('electron');

// High timeout time because I run this in a very slow VM
const timeoutTime = 15000;

var electronPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    'electron'
);

if (process.platform === 'win32') {
    electronPath += '.cmd';
}

var appPath = path.join(__dirname, '..');

var app = new Application({
    env: { RUNNING_IN_SPECTRON: '1' },
    path: electronPath,
    args: [appPath],
    chromeDriverLogPath: 'chrome-driver.log'
});

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('Test OVis', function() {
    beforeEach(function() {
        this.timeout(timeoutTime);
        return app.start();
    });

    afterEach(function() {
        this.timeout(timeoutTime);
        return app.stop();
    });

    it('opens a window', function() {
        return app.client
            .waitUntilWindowLoaded()
            .getWindowCount()
            .should.eventually.equal(1);
    });

    it('tests the title', function() {
        return app.client
            .waitUntilWindowLoaded()
            .getTitle()
            .should.eventually.equal('OpenMDAO Visualization');
    });

    it('opens test db', function() {
        app.client.element('#openButton').click();
        return app.client
            .waitUntilWindowLoaded()
            .element('#plotControls')
            .should.eventually.not.equal(null);
    });
});
