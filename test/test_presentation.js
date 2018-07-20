const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const DataInterface = require('../src/data_server/presentation/DataInterface');
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

var presentation = null;
var databases = [];

async function createNewDB() {
    let id = crypto.randomBytes(16).toString('hex');
    let fname = await createNewDatabase(id);
    databases.push(fname);
    return fname;
}

describe('Test presentation layer', () => {
    beforeEach(function() {
        this.timeout(timeoutTime);
        presentation = new DataInterface(logger);
    });

    afterEach(function() {
        this.timeout(timeoutTime);
        presentation.disconnect();
        presentation = null;

        for (let i = 0; i < databases.length; ++i) {
            let db = databases[i];
            fs.unlinkSync(db);
        }
        databases = [];
    });

    it('Verify sellar connect', done => {
        presentation.connect(sellarLocation).then(() => {
            assert.isNotNull(presentation._logic._data._db);
            done();
        });
    });

    it('Verify sellar disconnect', done => {
        presentation.connect(sellarLocation).then(() => {
            assert.isNotNull(presentation._logic._data._db);
            presentation.disconnect();
            assert.isNull(presentation._logic._data._db);
            done();
        });
    });

    it('Verify basic fail connect', done => {
        presentation.connect('bad filename').catch(e => {
            assert.isNull(presentation._logic._data._db);
            done();
        });
    });

    it('Verify getLayout fails when not connected', done => {
        presentation
            .getLayout()
            .then(() => {
                assert.fail(
                    'getLayout did not reject promise with no DB connection'
                );
                done();
            })
            .catch(e => {
                assert.isNull(presentation._logic._data._db);
                done();
            });
    });

    it('Verify getLayout succeeds on sellar', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getLayout();
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
        presentation
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
                assert.isNull(presentation._logic._data._db);
                done();
            });
    });

    it('Verify getMetadata works on sellar', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getMetadata();
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
        presentation
            .getDriverIterationData('test')
            .then(() => {
                assert.fail('', '', 'Should have failed');
                done();
            })
            .catch(err => {
                assert.isNull(presentation._logic._data._db);
                done();
            });
    });

    it('Verify getDriverIterationData works for sellar', done => {
        presentation.connect(sellarLocation).then(() => {
            return presentation
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
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('con_cmp1.con1');
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
                presentation
                    .connect(fn)
                    .then(() => {
                        return presentation.getLayout();
                    })
                    .then(layout => {
                        assert.equal(layout.length, 0);
                        return presentation.updateLayout({
                            layout: { test: true }
                        });
                    })
                    .then(() => {
                        return presentation.getLayout();
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
        presentation.getModelViewerData().catch(err => {
            assert.isNull(presentation._logic._data._db);
            done();
        });
    });

    it('Verify getModelViewerData reject no data', done => {
        createNewDB()
            .then(fn => {
                return presentation.connect(fn);
            })
            .then(() => {
                return presentation.getModelViewerData();
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
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getModelViewerData();
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
        presentation.getDriverIterationsBasedOnCount('test', 0).catch(err => {
            assert.isNull(presentation._logic._data._db);
            done();
        });
    });

    it('Verify getDriverIterationsBasedOnCount false when db empty', done => {
        createNewDB()
            .then(fn => {
                return presentation.connect(fn);
            })
            .then(() => {
                return presentation.getDriverIterationsBasedOnCount(
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
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationsBasedOnCount(
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
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationsBasedOnCount(
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
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationsBasedOnCount(
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
        presentation.getAllDriverVars().then(ret => {
            assert.equal(ret.desvars.length, 0);
            assert.equal(ret.objectives.length, 0);
            assert.equal(ret.constraints.length, 0);
            assert.equal(ret.sysincludes.length, 0);
            assert.equal(ret.inputs.length, 0);
            done();
        });
    });

    it('Verify getAllDriverVars empty with empty DB', done => {
        createNewDB()
            .then(fn => {
                return presentation.connect(fn);
            })
            .then(() => {
                return presentation.getAllDriverVars();
            })
            .then(ret => {
                assert.equal(ret.desvars.length, 0);
                assert.equal(ret.objectives.length, 0);
                assert.equal(ret.constraints.length, 0);
                assert.equal(ret.sysincludes.length, 0);
                assert.equal(ret.inputs.length, 0);
                done();
            });
    });

    it('Verify getDriverIterationData desvar', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('pz.z');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'pz.z');
                assert.equal(data[0]['type'], 'desvar');
                done();
            });
    });

    it('Verify getDriverIterationData objective', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('obj_cmp.obj');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'obj_cmp.obj');
                assert.equal(data[0]['type'], 'objective');
                done();
            });
    });

    it('Verify getDriverIterationData constraint', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('con_cmp2.con2');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'con_cmp2.con2');
                assert.equal(data[0]['type'], 'constraint');
                done();
            });
    });

    it('Verify getDriverIterationData sysinclude', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('mda.d2.y2');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'mda.d2.y2');
                assert.equal(data[0]['type'], 'sysinclude');
                done();
            });
    });

    it('Verify getDriverIterationData input', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getDriverIterationData('obj_cmp.y1');
            })
            .then(data => {
                assert.equal(data[0]['name'], 'obj_cmp.y1');
                assert.equal(data[0]['type'], 'input');
                done();
            });
    });

    it('verify getAllDriverVars values with sellar', done => {
        presentation
            .connect(sellarLocation)
            .then(() => {
                return presentation.getAllDriverVars();
            })
            .then(ret => {
                let expected = {
                    desvars: ['pz.z', 'px.x'],
                    objectives: ['obj_cmp.obj'],
                    constraints: ['con_cmp2.con2', 'con_cmp1.con1'],
                    sysincludes: ['mda.d1.y1', 'mda.d2.y2'],
                    inputs: [
                        'mda.d1.x',
                        'mda.d2.z',
                        'obj_cmp.y1',
                        'obj_cmp.z',
                        'con_cmp2.y2',
                        'mda.d1.z',
                        'con_cmp1.y1',
                        'obj_cmp.y2',
                        'mda.d2.y1',
                        'obj_cmp.x',
                        'mda.d1.y2',
                        'mda.d2.y1',
                        'obj_cmp.x',
                        'mda.d1.y2'
                    ]
                };

                for (let i = 0; i < expected['desvars'].length; ++i) {
                    let name = expected['desvars'][i];
                    assert.isTrue(ret['desvars'].includes(name));
                }
                for (let i = 0; i < expected['objectives'].length; ++i) {
                    let name = expected['objectives'][i];
                    assert.isTrue(ret['objectives'].includes(name));
                }
                for (let i = 0; i < expected['constraints'].length; ++i) {
                    let name = expected['constraints'][i];
                    assert.isTrue(ret['constraints'].includes(name));
                }
                for (let i = 0; i < expected['sysincludes'].length; ++i) {
                    let name = expected['sysincludes'][i];
                    assert.isTrue(ret['sysincludes'].includes(name));
                }
                for (let i = 0; i < expected['inputs'].length; ++i) {
                    let name = expected['inputs'][i];
                    assert.isTrue(ret['inputs'].includes(name));
                }
                done();
            });
    });
});
