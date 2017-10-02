var plotConfig = {
    type: 'component',
    componentName: 'Variable vs. Iterations',
    componentState: { label: 'B' }
};

var config = {
    content: [{
        type: 'row',
        content: [{
            type: 'component',
            componentName: 'Partition Tree and N<sup>2</sup>',
            componentState: { label: 'A' }
        }, {
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