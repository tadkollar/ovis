const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const SqliteData = require('../src/data_server/data/sqlite_data');
const logger = require('electron-log');
const {
    length,
    assertArrayClose,
    createNewDatabase
} = require('./test_helper');
const assert = chai.assert;
const fs = require('fs');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');

const timeoutTime = 30000;
logger.transports.file.level = false;
logger.transports.console.level = false;

const sellarLocation = __dirname + '/sellar_grouped.db';

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

var data = null;
var databases = [];

async function createNewDB() {
    let id = crypto.randomBytes(16).toString('hex');
    let fname = await createNewDatabase(id);
    databases.push(fname);
    return fname;
}

describe('Test SQLite data layer', () => {
    beforeEach(function() {
        this.timeout(timeoutTime);
        data = new SqliteData(logger);
    });

    afterEach(function() {
        this.timeout(timeoutTime);
        data.disconnect();
        data = null;

        for (let i = 0; i < databases.length; ++i) {
            let db = databases[i];
            fs.unlinkSync(db);
        }
        databases = [];
    });

    it('Verify db starts as null', () => {
        assert.isNull(data._db);
    });

    it('Verify disconnect runs when not connected', () => {
        assert.isNull(data._db);
        data.disconnect();
        assert.isNull(data._db);
    });

    it('Verify sellar connect', done => {
        data.connect(sellarLocation).then(() => {
            assert.isNotNull(data._db);
            done();
        });
    });

    it('Verify sellar disconnect', done => {
        data.connect(sellarLocation).then(() => {
            assert.isNotNull(data._db);
            data.disconnect();
            assert.isNull(data._db);
            done();
        });
    });

    it('Verify basic fail connect', done => {
        data.connect('bad filename').catch(e => {
            assert.isNull(data._db);
            done();
        });
    });

    it('Verify connect gathers metadata', done => {
        data.connect(sellarLocation)
            .then(() => {
                assert.isNotNull(data._prom2abs);
                assert.isNotNull(data._abs2prom);
                done();
            })
            .catch(e => {
                assert.fail(
                    '',
                    '',
                    'Data did not have metadata after connecting'
                );
                done();
            });
    });

    it('Verify layout table added to DB', done => {
        createNewDB().then(fn => {
            data.connect(fn).then(() => {
                let db = new sqlite3.Database(fn, sqlite3.OPEN_READONLY, () => {
                    db.get(
                        'SELECT name FROM sqlite_master WHERE type="table" AND name="layouts"',
                        (err, row) => {
                            assert.isNotNull(row);
                            done();
                        }
                    );
                });
            });
        });
    });

    it('Verify do not connect to bad DB', done => {
        data.connect('bad filename').catch(err => {
            assert.isNull(data._db);
            done();
        });
    });

    it('Verify getLayout fails when not connected', done => {
        data.getLayout()
            .then(() => {
                assert.fail(
                    'getLayout did not reject promise with no DB connection'
                );
                done();
            })
            .catch(e => {
                assert.isNull(data._db);
                done();
            });
    });

    it('Verify getLayout succeeds on sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.getLayout();
            })
            .then(layout => {
                let l_layout = JSON.parse(layout[0]['layout']);
                assert.isNotNull(l_layout['settings']);
                assert.isNotNull(l_layout['dimensions']);
                assert.isNotNull(l_layout['labels']);
                assert.isNotNull(l_layout['content']);
                done();
            })
            .catch(e => {
                assert.fail(
                    '',
                    '',
                    'Could not get layout. Reason: ' + e.toString()
                );
                done();
            });
    });

    it('Verify getLayout succeeds after update', done => {
        createNewDB()
            .then(fn => {
                return data.connect(fn);
            })
            .then(() => {
                return data.updateLayout('{"test": true}');
            })
            .then(() => {
                return data.getLayout();
            })
            .then(layout => {
                assert.deepEqual(layout[0], { test: true });
                done();
            });
    });

    it('Verify updateLayout fails without connect', done => {
        data.updateLayout('{test: true}').catch(err => {
            assert.isNotNull(err);
            done();
        });
    });

    it('Verify getMetadata fails without DB', done => {
        data.getMetadata()
            .then(() => {
                assert.fail(
                    '',
                    '',
                    'Succeeded in getting metadata when should have failed'
                );
                done();
            })
            .catch(e => {
                assert.isNull(data._db);
                done();
            });
    });

    it('Verify getMetadata works on sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.getMetadata();
            })
            .then(metadata => {
                // make sure it isn't none
                assert.isNotNull(metadata['abs2prom']);
                assert.isNotNull(metadata['prom2abs']);
                assert.isNotNull(metadata['abs2meta']);

                // make sure we have two keys ('input' and 'output)
                assert.equal(length(metadata['abs2prom']), 2);
                assert.equal(length(metadata['prom2abs']), 2);
                assert.equal(length(metadata['abs2meta']), 18);

                // make sure we have the expected number of variables
                assert.equal(length(metadata['abs2prom']['input']), 11);
                assert.equal(length(metadata['abs2prom']['output']), 7);
                assert.equal(length(metadata['prom2abs']['input']), 4);
                assert.equal(length(metadata['prom2abs']['output']), 7);
                done();
            })
            .catch(e => {
                assert.fail(
                    '',
                    '',
                    'Failed to get metadata. Reason: ' + e.toString()
                );
                done();
            });
    });

    it('Verify getMetadata returns null on new database', done => {
        createNewDB()
            .then(fn => {
                return data.connect(fn);
            })
            .then(() => {
                return data.getMetadata();
            })
            .then(metadata => {
                assert.isNull(metadata['abs2prom']);
                assert.isNull(metadata['prom2abs']);
                assert.isNull(metadata['abs2meta']);
                done();
            });
    });

    it('Verify getDriverIterationData fails without connection', done => {
        data.getDriverIterationData()
            .then(() => {
                assert.fail('', '', 'Should have failed');
                done();
            })
            .catch(err => {
                assert.isNull(data._db);
                done();
            });
    });

    it('Verify getDriverIterationData works for sellar', done => {
        data.connect(sellarLocation).then(() => {
            return data
                .getDriverIterationData()
                .then(data => {
                    assert.equal(data.length, 7);
                    done();
                })
                .catch(err => {
                    assert.fail(
                        '',
                        '',
                        'Failed to get iteration data. Reason: ' +
                            err.toString()
                    );
                    done();
                });
        });
    });

    it('Verify getDriverItionData data correct on Sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.getDriverIterationData();
            })
            .then(data => {
                let iter = data[0];
                let desvars = [
                    { name: 'pz.z', values: [5.0, 2.0] },
                    { name: 'px.x', values: [1.0] }
                ];
                let objectives = [
                    { name: 'obj_cmp.obj', values: [28.5883081] }
                ];
                let sysincludes = [
                    { name: 'mda.d2.y2', values: [12.05848815] },
                    { name: 'mda.d1.y1', values: [25.58830237] }
                ];
                let constraints = [
                    { name: 'con_cmp1.con1', values: [-22.42830237] },
                    { name: 'con_cmp2.con2', values: [-11.94151184] }
                ];
                let inputs = [
                    { name: 'mda.d2.y1', values: [25.58830237] },
                    { name: 'con_cmp2.y2', values: [12.05848815] },
                    { name: 'mda.d1.x', values: [1.0] },
                    { name: 'mda.d1.z', values: [5.0, 2.0] },
                    { name: 'obj_cmp.x', values: [1.0] },
                    { name: 'obj_cmp.z', values: [5.0, 2.0] },
                    { name: 'obj_cmp.y1', values: [25.58830237] },
                    { name: 'obj_cmp.y2', values: [12.05848815062] },
                    { name: 'mda.d2.z', values: [5.0, 2.0] },
                    { name: 'con_cmp1.y1', values: [25.58830237] },
                    { name: 'mda.d1.y2', values: [12.05848815] }
                ];

                for (let i = 0; i < constraints.length; ++i) {
                    let c = constraints[i];
                    assertArrayClose(c, iter['constraints']);
                }
                for (let i = 0; i < desvars.length; ++i) {
                    let c = desvars[i];
                    assertArrayClose(c, iter['desvars']);
                }
                for (let i = 0; i < objectives.length; ++i) {
                    let c = objectives[i];
                    assertArrayClose(c, iter['objectives']);
                }
                for (let i = 0; i < sysincludes.length; ++i) {
                    let c = sysincludes[i];
                    assertArrayClose(c, iter['sysincludes']);
                }
                for (let i = 0; i < inputs.length; ++i) {
                    let c = inputs[i];
                    assertArrayClose(c, iter['inputs']);
                }

                done();
            })
            .catch(err => {
                assert.fail(
                    '',
                    '',
                    'Failed to get iteration data. Reason: ' + err.toString()
                );
                done();
            });
    });

    it('Verify update layout on new DB', done => {
        createNewDB()
            .then(fn => {
                data.connect(fn)
                    .then(() => {
                        return data.getLayout();
                    })
                    .then(layout => {
                        assert.equal(layout.length, 0);
                        return data.updateLayout(
                            '{"layout": "{\\"test\\": true}"}'
                        );
                    })
                    .then(() => {
                        return data.getLayout();
                    })
                    .then(layout => {
                        assert.equal(layout[0]['layout'], '{"test": true}');
                        done();
                    });
            })
            .catch(err => {
                assert.fail(
                    '',
                    '',
                    'Failed to update layout. Reason: ' + err.toString()
                );
                done();
            });
    });

    it('Verify getModelViewerData reject without connect', done => {
        data.getModelViewerData().catch(err => {
            assert.isNull(data._db);
            done();
        });
    });

    it('Verify getModelViewerData reject no data', done => {
        createNewDB()
            .then(fn => {
                return data.connect(fn);
            })
            .then(() => {
                return data.getModelViewerData();
            })
            .then(data => {
                assert.equal(data.length, 0);
                done();
            })
            .catch(err => {
                assert.fail(
                    '',
                    '',
                    'Failed to get model viewer data. Reason: ' + err.toString()
                );
                done();
            });
    });

    it('Verify getModelViewerData on sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.getModelViewerData();
            })
            .then(data => {
                let mvd = data[0];
                assert.isNotNull(mvd['model_viewer_data']);
                assert.isNotNull(mvd['model_viewer_data']['tree']);
                assert.isNotNull(mvd['model_viewer_data']['connections_list']);
                assert.equal(
                    mvd['model_viewer_data']['connections_list'].length,
                    11
                );
                done();
            })
            .catch(err => {
                assert.fail(
                    '',
                    '',
                    'Failed to get model viewer data. Reason: ' + err.toString()
                );
                done();
            });
    });

    it('Verify isNewIterationData rejects without db', done => {
        data.isNewDriverIterationData(0).catch(err => {
            assert.isNull(data._db);
            done();
        });
    });

    it('Verify isNewIterationData false when db empty', done => {
        createNewDB()
            .then(fn => {
                return data.connect(fn);
            })
            .then(() => {
                return data.isNewDriverIterationData(-1);
            })
            .then(ans => {
                assert.equal(ans, false);
                done();
            });
    });

    it('Verify isNewIterationData ret false on sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.isNewDriverIterationData(100);
            })
            .then(ret => {
                assert.equal(ret, false);
                done();
            });
    });

    it('Verify isNewIterationData ret true on sellar', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.isNewDriverIterationData(0);
            })
            .then(ret => {
                assert.equal(ret, true);
                done();
            });
    });

    it('Verify isNewIterationData ret false on equal', done => {
        data.connect(sellarLocation)
            .then(() => {
                return data.isNewDriverIterationData(14);
            })
            .then(ret => {
                assert.equal(ret, false);
                done();
            });
    });
});
