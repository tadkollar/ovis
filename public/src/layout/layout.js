var plotConfig = {
    type: 'component',
    componentName: 'Variable vs. Iterations',
    componentState: { label: 'B' }
};

var n2Config = {
    type: 'component',
    componentName: 'Partition Tree and N<sup>2</sup>',
    componentState: { label: 'A' }
};

var config = {
    content: [{
        type: 'row',
        content: [n2Config, {
            type: 'column',
            content: [plotConfig, plotConfig]
        }]
    }]
};

var createLayout = function (newConfig) {
    var layout = new GoldenLayout(newConfig);
    registerN2(layout);
    registerPlot(layout);
    layout.container = "#goldenLayout";
    layout._isFullPage = true;
    layout.init();
    return layout;
}

var registerN2 = function(layout) {
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

var registerPlot = function(layout) {
    layout.registerComponent('Variable vs. Iterations', function (container, componentState) {
        http.get("components/plot.html", function (response) {
            container.getElement().html(response);
            createPlot(container);
        });
    });
}

var addNewPlot = function () {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(plotConfig);
    }
    else {
        //Remove the previous layout
        var n = document.getElementById("goldenLayout");
        while(n.firstChild) {
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

var addNewN2 = function () {
    if (myLayout.root !== null && myLayout.root.contentItems.length > 0) {
        myLayout.root.contentItems[0].addChild(n2Config);
    }
    else {
        //Remove the previous layout
        var n = document.getElementById("goldenLayout");
        while(n.firstChild) {
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

myLayout = createLayout(config);