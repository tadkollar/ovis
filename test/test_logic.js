const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Logic = require('../src/data_server/logic/logic');
const logger = require('electron-log');
const {
    length,
    assertArrayClose,
    createNewDatabase
} = require('./test_helper');
const assert = chai.assert;
const expect = chai.expect;
const fs = require('fs');
const crypto = require('crypto');

const timeoutTime = 30000;
logger.transports.file.level = false;
logger.transports.console.level = false;

const sellarLocation = __dirname + '/sellar_grouped.db';

global.before(function() {
    chai.should();
    chai.use(chaiAsPromised);
});

var logic = null;
var databases = [];

async function createNewDB() {
    let id = crypto.randomBytes(16).toString('hex');
    let fname = await createNewDatabase(id);
    databases.push(fname);
    return fname;
}

describe('Test logic layer', () => {
    beforeEach(function() {
        this.timeout(timeoutTime);
        logic = new Logic(logger);
    });

    afterEach(function() {
        this.timeout(timeoutTime);
        logic.disconnect();
        logic = null;

        for (let i = 0; i < databases.length; ++i) {
            let db = databases[i];
            fs.unlinkSync(db);
        }
        databases = [];
    });

    it('Verify sellar connect', done => {
        logic.connect(sellarLocation).then(() => {
            assert.isNotNull(logic._data._db);
            done();
        });
    });

    it('Verify sellar disconnect', done => {
        logic.connect(sellarLocation).then(() => {
            assert.isNotNull(logic._data._db);
            logic.disconnect();
            assert.isNull(logic._data._db);
            done();
        });
    });

    it('Verify basic fail connect', done => {
        logic.connect('bad filename').catch(e => {
            assert.isNull(logic._data._db);
            done();
        });
    });

    it('Verify getLayout fails when not connected', done => {
        logic
            .getLayout()
            .then(() => {
                assert.fail(
                    'getLayout did not reject promise with no DB connection'
                );
                done();
            })
            .catch(e => {
                assert.isNull(logic._data._db);
                done();
            });
    });

    it('Verify getLayout succeeds on sellar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getLayout();
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

    it('Verify getMetadata fails without DB', done => {
        logic
            .getMetadata()
            .then(() => {
                assert.fail(
                    '',
                    '',
                    'Succeeded in getting metadata when should have failed'
                );
                done();
            })
            .catch(e => {
                assert.isNull(logic._data._db);
                done();
            });
    });

    it('Verify getMetadata works on sellar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getMetadata();
            })
            .then(metadata => {
                // make sure it isn't none
                assert.isNotNull(metadata['abs2prom']);
                assert.isNotNull(metadata['prom2abs']);

                // make sure we have two keys ('input' and 'output)
                assert.equal(length(metadata['abs2prom']), 2);
                assert.equal(length(metadata['prom2abs']), 2);

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

    it('Verify getDriverIterationData fails without connection', done => {
        logic
            .getDriverIterationData('test')
            .then(() => {
                assert.fail('', '', 'Should have failed');
                done();
            })
            .catch(err => {
                assert.isNull(logic._data._db);
                done();
            });
    });

    it('Verify getDriverIterationData works for sellar', done => {
        logic.connect(sellarLocation).then(() => {
            return logic
                .getDriverIterationData('con_cmp1.con1')
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
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('con_cmp1.con1');
            })
            .then(data => {
                let shouldBe = [
                    {
                        name: 'con_cmp1.con1',
                        values: [-22.42830237],
                        counter: 2,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-4.57433739],
                        counter: 4,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-0.550724156],
                        counter: 6,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-0.0020433821],
                        counter: 8,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-0.0],
                        counter: 10,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-1.2190648e-10],
                        counter: 12,
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        values: [-1.219064849e-10],
                        counter: 14,
                        type: 'constraint'
                    }
                ];

                for (let i = 0; i < data.length; ++i) {
                    let d = data[i];
                    let e = shouldBe[i];

                    assert.equal(d['name'], e['name']);
                    assert.equal(d['counter'], e['counter']);
                    assert.equal(d['type'], e['type']);
                    expect(d['values'][0]).to.be.closeTo(e['values'][0], 0.1);
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
                logic
                    .connect(fn)
                    .then(() => {
                        return logic.getLayout();
                    })
                    .then(layout => {
                        assert.equal(layout.length, 0);
                        return logic.updateLayout({ layout: { test: true } });
                    })
                    .then(() => {
                        return logic.getLayout();
                    })
                    .then(layout => {
                        assert.deepEqual(layout[0]['layout'], { test: true });
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
        logic.getModelViewerData().catch(err => {
            assert.isNull(logic._data._db);
            done();
        });
    });

    it('Verify getModelViewerData reject no data', done => {
        createNewDB()
            .then(fn => {
                return logic.connect(fn);
            })
            .then(() => {
                return logic.getModelViewerData();
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
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getModelViewerData();
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

    it('Verify getDriverIterationsBasedOnCount rejects without db', done => {
        logic.getDriverIterationsBasedOnCount('test', 0).catch(err => {
            assert.isNull(logic._data._db);
            done();
        });
    });

    it('Verify getDriverIterationsBasedOnCount false when db empty', done => {
        createNewDB()
            .then(fn => {
                return logic.connect(fn);
            })
            .then(() => {
                return logic.getDriverIterationsBasedOnCount(
                    'con_cmp1.con1',
                    -1
                );
            })
            .then(ans => {
                assert.equal(ans.length, 0);
                done();
            });
    });

    it('Verify getDriverIterationsBasedOnCount ret false on sellar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationsBasedOnCount(
                    'con_cmp1.con1',
                    100
                );
            })
            .then(ret => {
                assert.equal(ret.length, 0);
                done();
            });
    });

    it('Verify getDriverIterationsBasedOnCount ret true on sellar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationsBasedOnCount(
                    'con_cmp1.con1',
                    0
                );
            })
            .then(ret => {
                assert.equal(ret.length, 7);
                done();
            });
    });

    it('Verify getDriverIterationsBasedOnCount ret empty on equal', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationsBasedOnCount(
                    'con_cmp1.con1',
                    14
                );
            })
            .then(ret => {
                assert.equal(ret.length, 0);
                done();
            });
    });

    it('Verify getAllDriverVars without connection', done => {
        logic.getAllDriverVars().then(ret => {
            assert.equal(ret.length, 0);
            done();
        });
    });

    it('Verify getAllDriverVars empty with empty DB', done => {
        createNewDB()
            .then(fn => {
                return logic.connect(fn);
            })
            .then(() => {
                return logic.getAllDriverVars();
            })
            .then(ret => {
                assert.equal(ret.length, 0);
                done();
            });
    });

    it('Verify getDriverIterationData desvar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('pz.z');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'pz.z');
                assert.equal(data[0]['type'], 'desvar');
                done();
            });
    });

    it('Verify getDriverIterationData objective', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('obj_cmp.obj');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'obj_cmp.obj');
                assert.equal(data[0]['type'], 'objective');
                done();
            });
    });

    it('Verify getDriverIterationData constraint', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('con_cmp2.con2');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'con_cmp2.con2');
                assert.equal(data[0]['type'], 'constraint');
                done();
            });
    });

    it('Verify getDriverIterationData sysinclude', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('mda.d2.y2');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'mda.d2.y2');
                assert.equal(data[0]['type'], 'sysinclude');
                done();
            });
    });

    it('Verify getDriverIterationData input', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getDriverIterationData('obj_cmp.y1');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'obj_cmp.y1');
                assert.equal(data[0]['type'], 'input');
                done();
            });
    });

    it('verify getAllDriverVars values with sellar', done => {
        logic
            .connect(sellarLocation)
            .then(() => {
                return logic.getAllDriverVars();
            })
            .then(ret => {
                let expected = [
                    {
                        name: 'pz.z',
                        type: 'desvar'
                    },
                    {
                        name: 'px.x',
                        type: 'desvar'
                    },
                    {
                        name: 'obj_cmp.obj',
                        type: 'objective'
                    },
                    {
                        name: 'con_cmp2.con2',
                        type: 'constraint'
                    },
                    {
                        name: 'con_cmp1.con1',
                        type: 'constraint'
                    },
                    {
                        name: 'mda.d1.y1',
                        type: 'sysinclude'
                    },
                    {
                        name: 'mda.d2.y2',
                        type: 'sysinclude'
                    },
                    {
                        name: 'mda.d1.x',
                        type: 'input'
                    },
                    {
                        name: 'mda.d2.z',
                        type: 'input'
                    },
                    {
                        name: 'obj_cmp.y1',
                        type: 'input'
                    },
                    {
                        name: 'obj_cmp.z',
                        type: 'input'
                    },
                    {
                        name: 'con_cmp2.y2',
                        type: 'input'
                    },
                    {
                        name: 'mda.d1.z',
                        type: 'input'
                    },
                    {
                        name: 'con_cmp1.y1',
                        type: 'input'
                    },
                    {
                        name: 'obj_cmp.y2',
                        type: 'input'
                    },
                    {
                        name: 'mda.d2.y1',
                        type: 'input'
                    },
                    {
                        name: 'obj_cmp.x',
                        type: 'input'
                    },
                    {
                        name: 'mda.d1.y2',
                        type: 'input'
                    }
                ];

                for (let i = 0; i < ret.length; ++i) {
                    let e = expected[i];
                    let c = ret[i];
                    assert.equal(e['name'], c['name']);
                    assert.equal(e['type'], c['type']);
                }
                done();
            });
    });
});
