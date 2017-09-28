controlPanelOpen = false;
function emptyMethod(checked) { }

function openNav(logscaleXValue, logscaleYValue, stackedPlotValue, designVariables, objectives, constraints, 
                 checkedDesignVariables, checkedObjectives, checkedConstraints,
                 logscaleXFunction, logscaleYFunction, stackedPlotFunction, variablesFunction) {
    controlPanelOpen = true;
    panelOptions.logscaleXFunction = logscaleXFunction;
    panelOptions.logscaleYFunction = logscaleYFunction;
    panelOptions.stackedPlotFunction = stackedPlotFunction;
    panelOptions.variablesFunction = variablesFunction;
    panelOptions.logscaleXCheckbox.checked = logscaleXValue;
    panelOptions.logscaleYCheckbox.checked = logscaleYValue;
    panelOptions.stackedPlotCheckbox.checked = stackedPlotValue;
    panelOptions.designVariables = designVariables;
    panelOptions.objectives = objectives;
    panelOptions.constraints = constraints;

    panelOptions.designVariablesSelector.options = [];
    panelOptions.objectivesSelector.options = [];
    panelOptions.constraintsSelector.options = [];
    for(var i = 0; i < panelOptions.designVariablesSelector.options.length; ++i) {
        panelOptions.designVariablesSelector.options[i] = null;
    }
    for(var i = 0; i < panelOptions.objectivesSelector.options.length; ++i) {
        panelOptions.objectivesSelector.options[i] = null;
    }
    for(var i = 0; i < panelOptions.constraintsSelector.options.length; ++i) {
        panelOptions.constraintsSelector.options[i] = null;
    }
    panelOptions.designVariablesSelector.options.length = 0;
    $('#designVariablesSelection').selectpicker('refresh');
    $('#objectivesSelection').selectpicker('refresh');
    $('#constraintsSelection').selectpicker('refresh');
    for(var i = 0; i < designVariables.length; ++i) {
        var option = new Option(designVariables[i], designVariables[i]);
        panelOptions.designVariablesSelector.options.add(option)
    }
    for(var i = 0; i < objectives.length; ++i) {
        var option = new Option(objectives[i], objectives[i]);
        panelOptions.objectivesSelector.options.add(option)
    }
    for(var i = 0; i < constraints.length; ++i) {
        var option = new Option(constraints[i], constraints[i]);
        panelOptions.constraintsSelector.options.add(option)
    }
    $('#designVariablesSelection').selectpicker('refresh');
    $('#objectivesSelection').selectpicker('refresh');
    $('#constraintsSelection').selectpicker('refresh');
    $('#designVariablesSelection').selectpicker('val', checkedDesignVariables)
    $('#objectivesSelection').selectpicker('val', checkedObjectives)
    $('#constraintsSelection').selectpicker('val', checkedConstraints)
    
    document.getElementById("mySidenav").style.width = "350px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
    controlPanelOpen = false;
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

function variablesSelected(variable, val, type) {
    console.log("running variablesSelected");
    if(panelOptions.variablesFunction) {
        panelOptions.variablesFunction(variable, val, type);
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
    designVariablesSelector: document.getElementById('designVariablesSelection'),
    objectivesSelector: document.getElementById('objectivesSelection'),
    constraintsSelector: document.getElementById('constraintsSelection')
};

$('#designVariablesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.designVariables[clickedIndex], newValue, 'desvar');
});

$('#objectivesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.objectives[clickedIndex], newValue, 'objective');
});

$('#constraintsSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.constraints[clickedIndex], newValue, 'constraint');
});