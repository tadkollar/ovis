var fs = require('fs');
var path = require('path');

// The list of callbacks to get configs from plots
// so that we can update their componentState on the server.
// NOTE: It's the responsibility of the plot to add its callback.
// Passing by reference does not work when passing around componentState, unfortunately
var configCallbacks = [];
var lastLayout = null;

// Grab the ptn2 and plot HTML data
let ptn2_loc = path.join(__dirname, '../components/partition_tree_n2.html');
let plot_loc = path.join(__dirname, '../components/plot.html');
let ptn2_file = fs.readFileSync(ptn2_loc);
let plot_file = fs.readFileSync(plot_loc);

/**
 * Returns a random number between 0 and 100,000,000
 *
 * @returns {String} random number as string
 */
var getRand = function() {
    return Math.floor(Math.random() * 100000000).toString();
};

/**
 * Get a plot configuration
 */
var getPlotConfig = function() {
    //Golden Layout configuration for plots
    let plotConfig = {
        type: 'component',
        componentName: 'Variable vs. Iterations',
        componentState: {
            label: getRand(),
            localscaleXVal: false,
            localscaleYVal: false,
            stackedPlotVal: false,
            selectedDesignVariables: [],
            selectedConstraints: [],
            selectedObjectives: [],
            selectedSysincludes: [],
            variableIndices: []
        }
    };
    return plotConfig;
};

/**
 * Get an N2 configuration
 */
var getN2Config = function() {
    //Golden Layout configuration for N^2
    let n2Config = {
        type: 'component',
        componentName: 'Partition Tree and N<sup>2</sup>',
        componentState: { label: getRand() }
    };
    return n2Config;
};

/**
 * Creates a new Golden Layout based on the configuration passed
 * to it and returns the GoldenLayout.
 *
 * @param {*} newConfig
 */
var createLayout = function(newConfig) {
    let layout = new GoldenLayout(newConfig);
    registerN2(layout);
    registerPlot(layout);
    layout.container = '#goldenLayout';
    layout._isFullPage = true;
    layout.init();
    layout.on('stateChanged', function() {
        saveLayout(layout);
    });
    return layout;
};

/**
 * Registers the N^2 Golden Layout configuration so that N^2 diagrams
 * may be added
 *
 * @param {*} layout
 */
var registerN2 = function(layout) {
    layout.registerComponent('Partition Tree and N<sup>2</sup>', function(
        container,
        componentState
    ) {
        let resourceLocation = process.resourcesPath;
        container.getElement().html(ptn2_file.toString());

        // ptn2 is a global variable found in ptn2.js
        ptn2.initializeTree(container);

        // Disable the Add N2 button because you can't have multiple N2
        document.getElementById('addN2Button').disabled = true;

        // If we close the container, re-enable the Add N2 button
        container.on('destroy', function(container) {
            document.getElementById('addN2Button').disabled = false;
        });
    });
};

/**
 * Registers the Plot Golden Layout configuration s othat plots may be
 * added
 *
 * @param {*} layout
 */
var registerPlot = function(layout) {
    layout.registerComponent('Variable vs. Iterations', function(
        container,
        componentState
    ) {
        // Add the plot component to the container
        container.getElement().html(plot_file.toString());

        // Global function found in plot.js
        createPlot(container, componentState);
    });
};

/**
 * Adds another plot to the current dashboard or creates a new
 * dashboard if one does not exist.
 */
var addNewPlot = function() {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(getPlotConfig());
    } else {
        //Everything was deleted in the dashboard
        //Remove the previous layout
        let n = document.getElementById('goldenLayout');
        while (n.firstChild) {
            n.removeChild(n.firstChild);
        }

        //Configure new layout
        let newConfig = {
            content: [
                {
                    type: 'row',
                    content: [getPlotConfig()]
                }
            ]
        };
        myLayout = createLayout(newConfig);
    }
};

/**
 * Adds an N^2 diagram to the current dashboard or creaes a new
 * dashboard if one does not exist.
 */
var addNewN2 = function() {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(getN2Config());
    } else {
        //Remove the previous layout
        let n = document.getElementById('goldenLayout');
        while (n.firstChild) {
            n.removeChild(n.firstChild);
        }

        //Configure the new layout
        let newConfig = {
            content: [
                {
                    type: 'row',
                    content: [getN2Config()]
                }
            ]
        };
        myLayout = createLayout(newConfig);
    }
};

/**
 * Saves the current layout to the server
 *
 * @param {*} layout
 */
var saveLayout = function(layout) {
    if (layout === null) {
        //when plots are trying to save, layout will be null
        layout = lastLayout;

        if (lastLayout === null) {
            return;
        }
    }

    lastLayout = layout;
    let state = layout.toConfig();
    let componentStates = getComponentStates();
    replaceComponentStates(state, componentStates);
    state = JSON.stringify(state);
    let body = {
        layout: state
    };
    http.post('case/' + case_id + '/layout', body, function() {});
};

/**
 * Goes through, finds, and replaces all component states that are
 * in the component states map. Used by saveLayout
 *
 * NOTE: recursive method (could be replaced with a stack)
 *
 * @param {*} state
 * @param {*} componentStatesMap
 */
var replaceComponentStates = function(state, componentStatesMap) {
    if (state.hasOwnProperty('componentState')) {
        let label = state.componentState.label;
        if (Number(label) in componentStatesMap) {
            state.componentState = componentStatesMap[label];
        }
    }

    if (state.hasOwnProperty('content')) {
        for (let i = 0; i < state.content.length; ++i) {
            replaceComponentStates(state.content[i], componentStatesMap);
        }
    }
};

/**
 * Grabs all componentStates from the configCallbacks array.
 * Returns a map from label to componentState
 */
var getComponentStates = function() {
    let ret = {};
    for (let i = 0; i < configCallbacks.length; ++i) {
        let config = configCallbacks[i]();
        ret[config['label']] = config;
    }

    return ret;
};

//Create the initial golden layout dashboard
var url = window.location.href;
var url_split = url.split('/');
var case_id = '1885148375'; //url_split[url_split.length - 1];
http.get('case/' + case_id + '/layout', function(ret) {
    ret = JSON.parse(ret);
    if (ret.length === 0) {
        myLayout = createLayout(config);
    } else {
        myLayout = createLayout(JSON.parse(ret[0]['layout']));
    }
});

getFilename(function(filename) {
    if (filename.length > 14) {
        filename = filename.substring(0, 14) + '...';
    }

    document.getElementById('sidebarHeaderContent').innerHTML = filename;
    console.log(filename);
});

//Initial configuration.
// 2 plots next to an N^2
var config = {
    content: [
        {
            type: 'row',
            content: [
                getN2Config(),
                {
                    type: 'column',
                    content: [getPlotConfig(), getPlotConfig()]
                }
            ]
        }
    ]
};
