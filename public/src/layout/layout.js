var config = {
    content: [{
        type: 'row',
        content: [{
            type: 'component',
            componentName: 'Partition Tree and N<sup>2</sup>',
            componentState: { label: 'A' }
        }, {
            type: 'column',
            content: [{
                type: 'component',
                componentName: 'Plot1',
                componentState: { label: 'B' }
            }, {
                type: 'component',
                componentName: 'Plot2',
                componentState: { label: 'C' }
            }]
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

myLayout.registerComponent('Plot1', function (container, componentState) {
    http.get("components/plot.html", function (response) {
        container.getElement().html(response);
        createPlot(container);
    });
});

myLayout.registerComponent('Plot2', function (container, componentState) {
    http.get("components/plot.html", function (response) {
        container.getElement().html(response);
        createPlot(container);
    });
});

myLayout.init();