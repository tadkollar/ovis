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
                componentName: 'testComponent',
                componentState: { label: 'B' }
            }, {
                type: 'component',
                componentName: 'testComponent',
                componentState: { label: 'C' }
            }]
        }]
    }]
};

var myLayout =  new GoldenLayout( config );
myLayout.registerComponent('Partition Tree and N<sup>2</sup>', function(container, componentState) {
    console.log("Registering component PartitionTree")
    container.getElement().html('<h2>' + componentState.label + '</h2>');
});

myLayout.registerComponent('testComponent', function(container, componentState) {
    container.getElement().html('<h2>' + componentState.label + '</h2>');
});

myLayout.init();