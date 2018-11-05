const Application = require('spectron').Application;
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const sqlite3 = require('sqlite3');

/**
 * String identifier for N^2 diagrams
 */
const n2ID = '#ptN2ContentDivId';
/**
 * String identifier for plots
 */
const plotID = '#plot';
/**
 * String identifier for the "add plot" button
 */
const plotButtonID = '#addPlotButton';
/**
 * String identifier for the "add N^2" button
 */
const n2ButtonID = '#addN2Button';

/**
 * Utility function to wait 2 seconds (e.g. for an animation).
 */
exports.resolveAfter2Seconds = function() {
  return new Promise(resolve => {
    setTimeout(function() {
      resolve(20);
    }, 2000);
  });
};

/**
 * Get the first N^2 element found
 * @param {Application} app
 * @return {Promise} resolves to the N^2 element
 */
exports.getN2 = function(app) {
    return new Promise(function(resolve, reject) {
        app.client
            .waitUntilWindowLoaded()
            .element(n2ID)
            .then(e => {
                resolve(e);
            });
    });
};

/**
 * Get teh first plot element found
 * @param {Application} app
 * @return {Promise} resolves to the plot element
 */
exports.getPlot = function(app) {
    return new Promise(function(resolve, reject) {
        app.client
            .waitUntilWindowLoaded()
            .element(plotID)
            .then(e => {
                resolve(e);
            });
    });
};

/**
 * Get the number of N^2 diagrams in the application
 * @param {Application} app
 * @return {Promise} resolves to the number of N^2 elements
 */
exports.getN2Count = function(app) {
    return new Promise(function(resolve, reject) {
        app.client
            .waitUntilWindowLoaded()
            .elements(n2ID)
            .then(e => {
                resolve(e.value.length);
            });
    });
};

/**
 * Get the number of plots in the application
 * @param {Application} app
 * @return {Promise} resolves to the number of plots
 */
exports.getPlotCount = function(app) {
    return new Promise(function(resolve, reject) {
        app.client
            .waitUntilWindowLoaded()
            .elements(plotID)
            .then(e => {
                resolve(e.value.length);
            });
    });
};

/**
 * Get the "add plot" button
 * @param {Application} app
 * @return {Promise} resolves to the element
 */
exports.getAddPlotButton = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            resolve(app.client.element(plotButtonID));
        });
    });
};

/**
 * Assert that the "add plot" button is enabled
 * @param {Application} app
 * @return {Promise} resolves when assertion is complete
 */
exports.assertAddPlotButtonEnabled = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element(plotButtonID)
                .isEnabled()
                .should.eventually.equal(true)
                .then(() => {
                    resolve();
                });
        });
    });
};

/**
 * Click the "add plot" button
 * @param {Application} app
 * @return {Promise} resolved when the button is clicked
 */
exports.clickPlotButton = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element(plotButtonID)
                .click()
                .then(() => resolve());
        });
    });
};

/**
 * Get the "add N2" button
 * @param {Application} app
 * @return {Promise} resolves with the button
 */
exports.getAddN2Button = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            resolve(app.client.element(n2ButtonID));
        });
    });
};

/**
 * Click the "add N2" button
 * @param {Application} app
 * @return {Promise} resolves after click
 */
exports.clickAddN2Button = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element(n2ButtonID)
                .click()
                .then(() => resolve());
        });
    });
};

/**
 * Click the "idVerticalResize???px" link, where ??? is the given height
 * @param {Application} app
 * @param {int} height
 * @return {Promise} resolves after click
 */
exports.clickResizeN2 = function(app, height) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            var path = '//*[@id="n2Controls"]/div/div[4]/div/div[2]/button';
            app.client
                .moveToObject(path)
                .element('#idVerticalResize'+height+'px')
                .click()
                .then(() => resolve());
        });
    });
};

/**
 * Assert that the N2 diagram is the given height
 * @param {Application} app
 * @param {int} height
 * @return {Promise} resolves after assertion
 */
exports.assertN2height = function(app, height) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client.getElementSize(n2ID+' .ptN2ChartClass', 'height')
                .should.eventually.equal(height)
                .then(() => {
                    resolve();
                })
        });
    });
};

/**
 * Assert that the "add N2" button is enabled
 * @param {Application} app
 * @return {Promise} resolves after assertion
 */
exports.assertAddN2Enabled = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element(n2ButtonID)
                .isEnabled()
                .should.eventually.equal(true)
                .then(() => {
                    resolve();
                });
        });
    });
};

/**
 * Assert that the "add N2" button is disabled
 * @param {Application} app
 * @return {Promise} resolves after assertion
 */
exports.assertAddN2Disabled = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element(n2ButtonID)
                .isEnabled()
                .should.eventually.equal(false)
                .then(() => {
                    resolve();
                });
        });
    });
};

/**
 * Assert that the tool tip appears correctly
 * @param {Application} app
 * @return {Promise} resolves after assertion
 */
exports.assertTooltipText = function(app, path, text) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .moveToObject(path)
                .getText('.tool-tip').should.eventually.equal(text)
                .then(() => {
                    resolve();
                });
        });
    });
};

/**
 * Remove the N^2 diagram
 * @param {Application} app
 * @return {Promise} resolves after 'x' button is clicked
 */
exports.removeN2 = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element('.lm_row')
                .element('.lm_stack')
                .element('.lm_close_tab')
                .click()
                .then(() => resolve());
        });
    });
};

exports.clickPlot = function(app) {
    return new Promise(function(resolve, reject) {
        app.client.waitUntilWindowLoaded().then(() => {
            app.client
                .element('#plot')
                .click()
                .then(() => resolve());
        });
    });
};

/**
 * Get the number of keys in the object
 *
 * @param {JSON} obj
 * @returns {number}
 */
exports.length = function(obj) {
    return Object.keys(obj).length;
};

/**
 * Assert that the test value is close to its corresponding value
 * in the compSet.
 *
 * @param {*} testVal
 * @param {*} compSet
 * @param {number} delta expect vals to be close within delta
 */
exports.assertArrayClose = function(testVal, compSet, delta = 0.1) {
    let values_arr = [];
    for (let i = 0; i < compSet.length; ++i) {
        let t = compSet[i];
        if (t['name'] === testVal['name']) {
            values_arr.push(t);
        }
    }

    assert.equal(
        values_arr.length,
        1,
        'Expected to find a value with a unique name in the compSet but found 0 or more than 1 instead for name: ' +
            testVal['name']
    );

    for (let i = 0; i < testVal['values'].length; ++i) {
        let curVal = testVal['values'][i];
        let tVal = values_arr[0]['values'][i];
        expect(curVal).to.be.closeTo(tVal, delta);
    }
};

/**
 * Create a new empty database.
 *
 * @param {*} id
 */
exports.createNewDatabase = async function(id) {
    let tempFilepath = 'temp';
    let filename = __dirname + '/' + tempFilepath + id;
    let db = new sqlite3.Database(filename);

    // this is silly. Should find a way to replace this with chained promises
    return new Promise(function(resolve, reject) {
        db.run(
            'CREATE TABLE metadata(format_version INT, abs2prom TEXT, prom2abs TEXT, abs2meta TEXT)',
            () => {
                db.run(
                    'INSERT INTO metadata(format_version, abs2prom, prom2abs) VALUES(?,?,?)',
                    [1, null, null],
                    () => {
                        db.run(
                            'CREATE TABLE global_iterations(id INTEGER PRIMARY KEY, record_type TEXT, rowid INT)',
                            () => {
                                db.run(
                                    'CREATE TABLE driver_iterations(id INTEGER PRIMARY KEY, counter INT,iteration_coordinate TEXT, timestamp REAL, success INT, msg TEXT, inputs TEXT, outputs TEXT)',
                                    () => {
                                        db.run(
                                            'CREATE TABLE system_iterations(id INTEGER PRIMARY KEY, counter INT, iteration_coordinate TEXT, timestamp REAL, success INT, msg TEXT, inputs TEXT, outputs TEXT, residuals TEXT)',
                                            () => {
                                                db.run(
                                                    'CREATE TABLE solver_iterations(id INTEGER PRIMARY KEY, counter INT, iteration_coordinate TEXT, timestamp REAL, success INT, msg TEXT, abs_err REAL, rel_err REAL, solver_inputs TEXT, solver_output TEXT, solver_residuals TEXT)',
                                                    () => {
                                                        db.run(
                                                            'CREATE TABLE driver_metadata(id TEXT PRIMARY KEY, model_viewer_data TEXT)',
                                                            () => {
                                                                db.run(
                                                                    'CREATE TABLE system_metadata(id TEXT PRIMARY KEY, scaling_factors BLOB, component_metadata BLOB)',
                                                                    () => {
                                                                        db.run(
                                                                            'CREATE TABLE solver_metadata(id TEXT PRIMARY KEY, solver_options BLOB, solver_class TEXT)',
                                                                            () => {
                                                                                db.close();
                                                                                resolve(
                                                                                    filename
                                                                                );
                                                                            }
                                                                        );
                                                                    }
                                                                );
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};
