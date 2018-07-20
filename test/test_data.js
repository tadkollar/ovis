const chai = require('chai');
const Data = require('../src/data_server/data/data');
const logger = require('electron-log');
const chaiAsPromised = require('chai-as-promised');
const {
    length,
    assertArrayClose,
    createNewDatabase
} = require('./test_helper');
const assert = chai.assert;

logger.transports.file.level = false;
logger.transports.console.level = false;

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

var data = null;

describe('Test SQLite data layer', () => {
    beforeEach(function() {
        data = new Data(logger);
    });

    it('Verify connect throws exception', done => {
        data.connect('fail').catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify disconnect throws exception', done => {
        try {
            data.disconnect();
            assert.fail('', '', 'Connect should have thrown exception');
        } catch (e) {
            assert.isNotNull(e);
            done();
        }
    });

    it('Verify getMetadata throws exception', done => {
        data.getMetadata().catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify getDriverIterationData throws exception', done => {
        data.getDriverIterationData().catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify getModelViewerData throws exception', done => {
        data.getModelViewerData().catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify getModelViewerDatagetLayout throws exception', done => {
        data.getLayout().catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify updateLayout throws exception', done => {
        data.updateLayout('{test: true}').catch(e => {
            assert.isNotNull(e);
            done();
        });
    });

    it('Verify isNewDriverIterationData throws exception', done => {
        data.isNewDriverIterationData(0).catch(e => {
            assert.isNotNull(e);
            done();
        });
    });
});
