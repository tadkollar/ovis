const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai').use(require('chai-style'));
const chaiAsPromised = require('chai-as-promised');
const electron = require('electron');

// High timeout time because I run this in a very slow VM
const timeoutTime = 30000;

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
    env: { RUNNING_IN_VIS_INDEX_TESTS: '1' },
    path: electronPath,
    args: [appPath],
    chromeDriverLogPath: 'chrome-driver.log'
});

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('Test OVis Vis Page', () => {
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

    // N2 plot control options should initially be active
    it('default n2 control options active', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#n2Controls')
            .isEnabled()
            .should.eventually.equal(true);
    });

    // Plot control options should initially be disabled
    // it('default plot control options disabled', () => {
    //     return app.client
    //         .waitUntilWindowLoaded()
    //         .element('#plotControls')
    //         .should.eventually.have.style('display', 'none');
    // });

    // Should display the correct DB name
    it('display db name', () => {
        return app.client
            .waitUntilWindowLoaded()
            .getText('#sidebarHeaderContent')
            .should.eventually.contain('sellar_grouped');
    });
});
