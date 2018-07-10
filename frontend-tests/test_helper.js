const Application = require('spectron').Application;

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
 * @return {Promise} reslves when assertion is complete
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
