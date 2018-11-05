const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiStyle = require('chai-style');
const chaiAsPromised = require('chai-as-promised');
const helper = require('./test_helper');

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
    chromeDriverLogPath: 'chrome-driver.log',
    // TODO: 'moveToObject' is deprecated (used in helpers)
    webdriverOptions: ({deprecationWarnings : false})
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
        helper.getN2Count(app).then(count => {
            count.should.equal(1);
            done();
        });
    }).timeout(timeoutTime);

    // We should start with two plots
    it('verify exactly two plots', done => {
        helper.getPlotCount(app).then(count => {
            count.should.equal(2);
            done();
        });
    }).timeout(timeoutTime);

    // Make sure that the add plot button adds a plot
    it('add plot button should add plot', done => {
        helper.clickPlotButton(app).then(() => {
            helper.getPlotCount(app).then(count => {
                count.should.equal(3);
                done();
            });
        });
    }).timeout(timeoutTime);

    // Make sure that removing an N^2 re-enables the "add N^2" button
    it('Remove N2 enables N2 button', done => {
        helper.removeN2(app).then(() => {
            helper.assertAddN2Enabled(app).then(() => done());
        });
    }).timeout(timeoutTime);

    // Make sure that clicking the addN2 button adds an N2
    it('Add N2 button adds an N2', done => {
        helper.removeN2(app).then(() => {
            helper.clickAddN2Button(app).then(() => {
                helper.getN2Count(app).then(count => {
                    count.should.equal(1);
                    done();
                });
            });
        });
    }).timeout(timeoutTime);

    // Make sure that the tootip is correct
    it('Tooltip is correct', done => {
        // param
        var path = '#svgId > g:nth-child(4) > g:nth-child(9) > rect',
            text = 'state_eq.y2_actual';
        helper.assertTooltipText(app, path, text).then(() => done());
        // unconnected param
        var path = '#svgId > g:nth-child(4) > g.partition_group.unconnected_param',
            text = 'con_cmp2.y2';
        helper.assertTooltipText(app, path, text).then(() => done());
        // unknown
        var path = '#svgId > g:nth-child(4) > g:nth-child(15)',
            text = 'y1';
        helper.assertTooltipText(app, path, text).then(() => done());
        // implicit unknown
        var path = '#svgId > g:nth-child(4) > g.partition_group.unknown_implicit',
            text = 'state_eq.y2_command';
        helper.assertTooltipText(app, path, text).then(() => done());
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
            'sellar_state'
        );
    }).timeout(timeoutTime);

    // The N2 button should be disabled initially
    it('initially disabled N2 button', done => {
        helper.assertAddN2Disabled(app).then(() => done());
    }).timeout(timeoutTime);

    // The plot button should be enabled initially
    it('initially enabled plot button', done => {
        helper.assertAddPlotButtonEnabled(app).then(() => done());
    }).timeout(timeoutTime);

});

// checking all of them is overkill... let's just pick a representative sample
// var heights = [600, 650, 700, 750, 800, 850, 900, 950, 1000, 2000, 3000, 4000]
var heights = [600, 750, 900, 1000, 2000, 4000]
var border = 2;  // 1px border, top and bottom

heights.forEach((height) => {
    describe('Test Resizing N2 ' + height, () => {

        beforeEach(function() {
            this.timeout(timeoutTime);
            return app.start();
        });

        afterEach(function() {
            this.timeout(timeoutTime);
            return app.stop();
        });

        it('should change height to ' + height + 'px', done => {
            helper.clickResizeN2(app, height).then(() => {
                // wait 2 seconds to allow animation to play out
                helper.resolveAfter2Seconds().then(() => {
                    helper.assertN2height(app, height+border).then(() => {
                        done();
                    });
                })
            });
        }).timeout(timeoutTime);
    });
});
