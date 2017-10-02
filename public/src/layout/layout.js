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

var myLayout = new GoldenLayout(config);
myLayout.registerComponent('Partition Tree and N<sup>2</sup>', function (container, componentState) {
    http.get("components/partition_tree_n2.html", function (response) {
        container.getElement().html(response);
        ptn2.initializeTree();
    });
    document.getElementById('addN2Button').disabled = true;
    
    container.on('destroy', function (container) {
        document.getElementById('addN2Button').disabled = false;
    });
});

myLayout.registerComponent('Variable vs. Iterations', function (container, componentState) {
    http.get("components/plot.html", function (response) {
        container.getElement().html(response);
        createPlot(container);
    });
});

myLayout.container = "#goldenLayout";
myLayout._isFullPage = true;
myLayout.init();

var addNewPlot = function () {
    myLayout.root.contentItems[0].addChild(plotConfig);
};

var addNewN2 = function() {
    myLayout.root.contentItems[0].addChild(n2Config);
}