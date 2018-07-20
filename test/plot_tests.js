const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiStyle = require('chai-style');
const chaiAsPromised = require('chai-as-promised');
const helper = require('./test_helper');
const spectron = require('spectron');

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

describe('Test Plots', () => {
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
    // it('verify plots active', done => {
    //     app.client.waitUntilWindowLoaded().then(() => {
    //         // console.log(app.client.plotList);
    //         // for (var i = 0; i < 2; ++i) {
    //         //     app.client.plotList[i].active.should.equal(true);
    //         // }
    //         done();
    //     });
    // }).timeout(timeoutTime);
});
