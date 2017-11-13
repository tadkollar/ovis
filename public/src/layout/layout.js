//Golden Layout configuration for plots
var plotConfig = {
    type: 'component',
    componentName: 'Variable vs. Iterations',
    componentState: { label: 'B' }
};

//Golden Layout configuration for N^2
var n2Config = {
    type: 'component',
    componentName: 'Partition Tree and N<sup>2</sup>',
    componentState: { label: 'A' }
};

//Initial configuration.
// 2 plots next to an N^2
var config = {
    content: [{
        type: 'row',
        content: [n2Config, {
            type: 'column',
            content: [plotConfig, plotConfig]
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
    layout.on('stateChanged', function() {
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
        http.get("components/partition_tree_n2.html", function (response) {
            container.getElement().html(response);
            ptn2.initializeTree();
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
        http.get("components/plot.html", function (response) {
            container.getElement().html(response);
            createPlot(container);
        });
    });
}

/**
 * Adds another plot to the current dashboard or creates a new
 * dashboard if one does not exist.
 */
var addNewPlot = function () {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(plotConfig);
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
                content: [plotConfig]
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
        myLayout.root.contentItems[0].addChild(n2Config);
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
                content: [n2Config]
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
    var state = JSON.stringify(layout.toConfig());
    var body = {
        'layout': state
    }
    http.post('case/' + case_id + '/layout', body, function(response) {
        console.log("new state: " + state);
    })
}

//Create the initial golden layout dashboard
var url = window.location.href;
var url_split = url.split('/');
var case_id = url_split[url_split.length - 1];
http.get('case/' + case_id + '/layout', function(ret) {
    ret = JSON.parse(ret);
    if(ret === []) {
        myLayout = createLayout(config);
    }
    else {
        myLayout = createLayout(JSON.parse(ret[0]['layout']))
    }
})