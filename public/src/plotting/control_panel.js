
function emptyMethod(checked) { }

function openNav(logscaleXValue, logscaleYValue, stackedPlotValue, variables, checkedVariables,
                 logscaleXFunction, logscaleYFunction, stackedPlotFunction, variablesFunction) {
    
    panelOptions.logscaleXFunction = logscaleXFunction;
    panelOptions.logscaleYFunction = logscaleYFunction;
    panelOptions.stackedPlotFunction = stackedPlotFunction;
    panelOptions.variablesFunction = variablesFunction;
    panelOptions.logscaleXCheckbox.checked = logscaleXValue;
    panelOptions.logscaleYCheckbox.checked = logscaleYValue;
    panelOptions.stackedPlotCheckbox.checked = stackedPlotValue;
    panelOptions.variables = variables;
    panelOptions.variableSelector.options = [];
    for(var i = 0; i < panelOptions.variableSelector.options.length; ++i) {
        panelOptions.variableSelector.options[i] = null;
    }
    panelOptions.variableSelector.options.length = 0;
    $('.selectpicker').selectpicker('refresh');
    for(var i = 0; i < variables.length; ++i) {
        var option = new Option(variables[i], variables[i]);
        panelOptions.variableSelector.options.add(option)
    }
    $('.selectpicker').selectpicker('refresh');
    $('.selectpicker').selectpicker('val', checkedVariables)
    
    document.getElementById("mySidenav").style.width = "350px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.body.style.backgroundColor = "white";
}

function logscaleX() {
    if(panelOptions.logscaleXFunction) {
        panelOptions.logscaleXFunction(panelOptions.logscaleXCheckbox.checked);
    }
}

function logscaleY() {
    if(panelOptions.logscaleYFunction) {
        panelOptions.logscaleYFunction(panelOptions.logscaleYCheckbox.checked);
    }
}

function stackedPlot() {
    console.log("running stackedPlot");
    if(panelOptions.stackedPlotFunction) {
        panelOptions.stackedPlotFunction(panelOptions.stackedPlotCheckbox.checked);
    }
}

function variablesSelected(variable, val) {
    console.log("running variablesSelected");
    if(panelOptions.variablesFunction) {
        panelOptions.variablesFunction(variable, val);
    }
}

var panelOptions = {
    logscaleXFunction: emptyMethod,
    logscaleYFunction: emptyMethod,
    stackedPlotFunction: emptyMethod,
    variablesFunction: emptyMethod,

    logscaleXCheckbox: document.getElementById('logscaleXCheckbox'),
    logscaleYCheckbox: document.getElementById('logscaleYCheckbox'),
    stackedPlotCheckbox: document.getElementById('stackedPlotCheckbox'),
    variableSelector: document.getElementById('variableSelection')
};

$('.selectpicker').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.variables[clickedIndex], newValue);
});