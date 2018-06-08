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
    path: electronPath,
    args: [appPath],
    chromeDriverLogPath: 'chrome-driver.log'
});

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('Test OVis Index', () => {
    // ********** Set before/after methods ********** //

    beforeEach(function() {
        this.timeout(timeoutTime);
        return app.start();
    });

    afterEach(function() {
        this.timeout(timeoutTime);
        return app.stop();
    });

    // ******************** Tests ******************** //

    // Window should open automatically
    it('opens a window', () => {
        return app.client
            .waitUntilWindowLoaded()
            .getWindowCount()
            .should.eventually.equal(1);
    });

    // Title should be correct
    it('test the title', () => {
        return app.client
            .waitUntilWindowLoaded()
            .getTitle()
            .should.eventually.equal('OpenMDAO Visualization');
    });

    // Make sure the open button is enabled
    it('open button enabled', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#openButton')
            .isEnabled()
            .should.eventually.equal(true);
    });

    // The N2 button should be disabled initially
    it('test disabled N2 button', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#addN2Button')
            .isEnabled()
            .should.eventually.equal(false);
    });

    // The plot button should be disabled initially
    it('test disabled plot button', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#addPlotButton')
            .isEnabled()
            .should.eventually.equal(false);
    });
});
