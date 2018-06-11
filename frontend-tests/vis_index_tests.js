const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiStyle = require('chai-style');
const chaiAsPromised = require('chai-as-promised');

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
    chai.use(chaiStyle);
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

    // We should start with one N2
    it('verify only one N2', done => {
        app.client
            .waitUntilWindowLoaded()
            .elements('#ptN2ContentDivId')
            .then(vals => {
                vals.value.length.should.equal(1);
                done();
            });
    }).timeout(timeoutTime);

    // We should start with two plots
    it('verify exactly two plots', done => {
        app.client
            .waitUntilWindowLoaded()
            .elements('#plot')
            .then(vals => {
                vals.value.length.should.equal(2);
                done();
            });
    }).timeout(timeoutTime);

    // Make sure that the add plot button adds a plot
    it('add plot button should add plot', done => {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element('#addPlotButton')
                .click()
                .then(() => {
                    app.client.elements('#plot').then(vals => {
                        vals.value.length.should.equal(3);
                        done();
                    });
                });
        });
    }).timeout(timeoutTime);

    // Make sure that removing an N^2 re-enables the "add N^2" button
    it('Remove N2 enables N^2 button', done => {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element('.lm_row')
                .element('.lm_stack')
                .element('.lm_close_tab')
                .click()
                .then(() => {
                    app.client
                        .element('#addN2Button')
                        .isEnabled()
                        .should.eventually.equal(true)
                        .then(() => done());
                });
        });
    }).timeout(timeoutTime);

    // Window should open automatically
    it('opens a window', () => {
        return app.client
            .waitUntilWindowLoaded()
            .getWindowCount()
            .should.eventually.equal(1);
    }).timeout(timeoutTime);

    // Title should be correct
    it('test the title', () => {
        return app.client
            .waitUntilWindowLoaded()
            .getTitle()
            .should.eventually.equal('OpenMDAO Visualization');
    }).timeout(timeoutTime);

    // N2 control options should initially be active
    it('default n2 control options active', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#n2Controls')
            .isEnabled()
            .should.eventually.equal(true);
    }).timeout(timeoutTime);

    // Plot control options should be initially active
    it('default plot control options active', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#plotControls')
            .isEnabled()
            .should.eventually.equal(true);
    }).timeout(timeoutTime);

    // Should display the correct DB name
    it('display db name', () => {
        return app.client.waitUntilTextExists(
            '#sidebarHeaderContent',
            'sellar_grouped'
        );
    }).timeout(timeoutTime);

    // The N2 button should be disabled initially
    it('test disabled N2 button', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#addN2Button')
            .isEnabled()
            .should.eventually.equal(false);
    });

    // The plot button should be enabled initially
    it('test enabled plot button', () => {
        return app.client
            .waitUntilWindowLoaded()
            .element('#addPlotButton')
            .isEnabled()
            .should.eventually.equal(true);
    });
});
