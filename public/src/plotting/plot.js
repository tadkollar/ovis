var createPlot = function (container) {
    var element = container.getElement()[0].firstChild;
    // var element = document.getElementById('plot');
    element.style.width = container.width.toString() + 'px';
    element.style.height = container.height.toString() + 'px'

    if (element != null) {
        Plotly.plot(element, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16]
        }],
            { margin: { t: 0 } }
        );
    }

    var resize = function () {
        element.style.width = container.width.toString() + 'px';
        element.style.height = container.height.toString() + 'px';
        Plotly.relayout(element, {
            width: container.width,
            height: container.height
        });
    };

    container.on('resize', resize);
};