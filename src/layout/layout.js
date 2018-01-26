
var fs = require('fs');

/**
 * Returns a random number between 0 and 100,000,000
 */
var getID = function () {
    return (Math.floor(Math.random() * 100000000)).toString()
}

//The list of callbacks to get configs from plots
// so that we can update their componentState on the server.
// NOTE: It's the responsibility of the plot to add its callback.
// Passing by reference does not work when passing around componentState, unfortunately
var configCallbacks = [];
var lastLayout = null;

/**
 * Get a plot configuration
 */
var getPlotConfig = function () {
    //Golden Layout configuration for plots
    var plotConfig = {
        type: 'component',
        componentName: 'Variable vs. Iterations',
        componentState: {
            label: getID(),
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
}

/**
 * Get an N2 configuration
 */
var getN2Config = function () {
    //Golden Layout configuration for N^2
    var n2Config = {
        type: 'component',
        componentName: 'Partition Tree and N<sup>2</sup>',
        componentState: { label: getID() }
    };
    return n2Config;
}

//Initial configuration.
// 2 plots next to an N^2
var config = {
    content: [{
        type: 'row',
        content: [getN2Config(), {
            type: 'column',
            content: [getPlotConfig(), getPlotConfig()]
        }]
    }]
};

/**
 * Creates a new Golden Layout based on the configuration passed
 * to it and returns the GoldenLayout.
 * 
 * @param {*} newConfig 
 */
var createLayout = function (newConfig) {
    var layout = new GoldenLayout(newConfig);
    registerN2(layout);
    registerPlot(layout);
    layout.container = "#goldenLayout";
    layout._isFullPage = true;
    layout.init();
    layout.on('stateChanged', function () {
        saveLayout(layout);
    });
    return layout;
}

/**
 * Registers the N^2 Golden Layout configuration so that N^2 diagrams
 * may be added
 * 
 * @param {*} layout 
 */
var registerN2 = function (layout) {
    layout.registerComponent('Partition Tree and N<sup>2</sup>', function (container, componentState) {
        let resourceLocation = process.resourcesPath;
        fs.readFile(resourceLocation + '/app/components/partition_tree_n2.html', function (err, data) {
            container.getElement().html(data.toString());
            ptn2.initializeTree(container);
        });
        document.getElementById('addN2Button').disabled = true;

        container.on('destroy', function (container) {
            document.getElementById('addN2Button').disabled = false;
        });
    });
}

/**
 * Registers the Plot Golden Layout configuration s othat plots may be
 * added
 * 
 * @param {*} layout 
 */
var registerPlot = function (layout) {
    layout.registerComponent('Variable vs. Iterations', function (container, componentState) {
        let resourceLocation = process.resourcesPath;
        fs.readFile(resourceLocation + '/app/components/plot.html', function (err, data) {
            container.getElement().html(data.toString());
            createPlot(container, componentState);
        });
    });
}

/**
 * Adds another plot to the current dashboard or creates a new
 * dashboard if one does not exist.
 */
var addNewPlot = function () {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(getPlotConfig());
    }
    else { //Everything was deleted in the dashboard
        //Remove the previous layout
        var n = document.getElementById("goldenLayout");
        while (n.firstChild) {
            n.removeChild(n.firstChild);
        }

        //Configure new layout
        var newConfig = {
            content: [{
                type: 'row',
                content: [getPlotConfig()]
            }]
        };
        myLayout = createLayout(newConfig);
    }
};

/**
 * Adds an N^2 diagram to the current dashboard or creaes a new
 * dashboard if one does not exist.
 */
var addNewN2 = function () {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(getN2Config());
    }
    else {
        //Remove the previous layout
        var n = document.getElementById("goldenLayout");
        while (n.firstChild) {
            n.removeChild(n.firstChild);
        }

        //Configure the new layout
        var newConfig = {
            content: [{
                type: 'row',
                content: [getN2Config()]
            }]
        };
        myLayout = createLayout(newConfig);
    }
}

/**
 * Saves the current layout to the server
 * 
 * @param {*} layout 
 */
var saveLayout = function (layout) {
    if (layout == null) { //when plots are trying to save, layout will be null
        layout = lastLayout;
    }
    lastLayout = layout;
    var state = layout.toConfig();
    var componentStates = getComponentStates();
    replaceComponentStates(state, componentStates);
    state = JSON.stringify(state);
    var body = {
        'layout': state
    }
    http.post('case/' + case_id + '/layout', body, function () { });
}

/**
 * Goes through, finds, and replaces all component states that are 
 * in the component states map. Used by saveLayout
 * 
 * NOTE: recursive method (could be replaced with a stack)
 * 
 * @param {*} state 
 * @param {*} componentStatesMap 
 */
var replaceComponentStates = function (state, componentStatesMap) {
    if (state.hasOwnProperty('componentState')) {
        var label = state.componentState.label;
        if (Number(label) in componentStatesMap) {
            state.componentState = componentStatesMap[label];
        }
    }

    if (state.hasOwnProperty('content')) {
        for (var i = 0; i < state.content.length; ++i) {
            replaceComponentStates(state.content[i], componentStatesMap);
        }
    }
}

/**
 * Grabs all componentStates from the configCallbacks array.
 * Returns a map from label to componentState
 */
var getComponentStates = function () {
    var ret = {};
    for (var i = 0; i < configCallbacks.length; ++i) {
        var config = configCallbacks[i]();
        ret[config['label']] = config;
    }

    return ret;
}

/**
 * Log out by removing the cookie used to track the user
 */
var logout = function () {
    http.get('logout', function () {
        window.location = 'http://openmdao.org/visualization'
    });
}

//Create the initial golden layout dashboard
var url = window.location.href;
var url_split = url.split('/');
var case_id = "1885148375";//url_split[url_split.length - 1];
http.get('case/' + case_id + '/layout', function (ret) {
    ret = JSON.parse(ret);
    if (ret.length === 0) {
        myLayout = createLayout(config);
    }
    else {
        myLayout = createLayout(JSON.parse(ret[0]['layout']));
    }
})

getFilename(function(filename) {
    if(filename.length > 14) {
        filename = filename.substring(0, 14) + '...';
    }

    document.getElementById('sidebarHeaderContent').innerHTML = filename;
    console.log(filename);
});