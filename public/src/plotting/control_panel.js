
//Indicates whether or not the control panel is active
controlPanelOpen = false;

//Empty function - useful when certain functions haven't been assigned but are called
function emptyMethod(checked) { }

/**
 * Opens the control panel and initializes all values in the panel
 * 
 * @param {Bool} logscaleXValue 
 * @param {Bool} logscaleYValue 
 * @param {Bool} stackedPlotValue 
 * @param {[String]} designVariables 
 * @param {[String]} objectives 
 * @param {[String]} constraints 
 * @param {[String]]} checkedDesignVariables 
 * @param {[String]]} checkedObjectives 
 * @param {[String]} checkedConstraints 
 * @param {Method} logscaleXFunction 
 * @param {Method} logscaleYFunction 
 * @param {Method} stackedPlotFunction 
 * @param {Method} variablesFunction 
 */
function openNav(logscaleXValue, logscaleYValue, stackedPlotValue, designVariables, objectives, constraints,
                    checkedDesignVariables, checkedObjectives, checkedConstraints,
                    logscaleXFunction, logscaleYFunction, stackedPlotFunction, variablesFunction) {
    //Set that the control panel is open
    controlPanelOpen = true;

    //Set the callback functions
    panelOptions.logscaleXFunction = logscaleXFunction;
    panelOptions.logscaleYFunction = logscaleYFunction;
    panelOptions.stackedPlotFunction = stackedPlotFunction;
    panelOptions.variablesFunction = variablesFunction;

    //Set the check boxes
    panelOptions.logscaleXCheckbox.checked = logscaleXValue;
    panelOptions.logscaleYCheckbox.checked = logscaleYValue;
    panelOptions.stackedPlotCheckbox.checked = stackedPlotValue;

    //Set variables
    panelOptions.designVariables = designVariables;
    panelOptions.objectives = objectives;
    panelOptions.constraints = constraints;

    //Remove all previous variables from the dropdowns
    panelOptions.designVariablesSelector.options = [];
    panelOptions.objectivesSelector.options = [];
    panelOptions.constraintsSelector.options = [];
    for (var i = 0; i < panelOptions.designVariablesSelector.options.length; ++i) {
        panelOptions.designVariablesSelector.options[i] = null;
    }
    for (var i = 0; i < panelOptions.objectivesSelector.options.length; ++i) {
        panelOptions.objectivesSelector.options[i] = null;
    }
    for (var i = 0; i < panelOptions.constraintsSelector.options.length; ++i) {
        panelOptions.constraintsSelector.options[i] = null;
    }
    panelOptions.designVariablesSelector.options.length = 0;
    $('#designVariablesSelection').selectpicker('refresh');
    $('#objectivesSelection').selectpicker('refresh');
    $('#constraintsSelection').selectpicker('refresh');

    //Add the variables to their dropdowns
    for (var i = 0; i < designVariables.length; ++i) {
        var option = new Option(designVariables[i], designVariables[i]);
        panelOptions.designVariablesSelector.options.add(option)
    }
    for (var i = 0; i < objectives.length; ++i) {
        var option = new Option(objectives[i], objectives[i]);
        panelOptions.objectivesSelector.options.add(option)
    }
    for (var i = 0; i < constraints.length; ++i) {
        var option = new Option(constraints[i], constraints[i]);
        panelOptions.constraintsSelector.options.add(option)
    }

    //Refresh dropdowns 
    $('#designVariablesSelection').selectpicker('refresh');
    $('#objectivesSelection').selectpicker('refresh');
    $('#constraintsSelection').selectpicker('refresh');

    //Set the checked values for each dropdown
    $('#designVariablesSelection').selectpicker('val', checkedDesignVariables)
    $('#objectivesSelection').selectpicker('val', checkedObjectives)
    $('#constraintsSelection').selectpicker('val', checkedConstraints)

    //Set width and background color
    document.getElementById("mySidenav").style.width = "350px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

/**
 * Closes the control panel
 */
function closeNav() {
    controlPanelOpen = false;
    document.getElementById("mySidenav").style.width = "0";
    document.body.style.backgroundColor = "white";
}

/**
 * Callback when Logarithmic x-axis is checked/unchecked
 */
function logscaleX() {
    if (panelOptions.logscaleXFunction) {
        panelOptions.logscaleXFunction(panelOptions.logscaleXCheckbox.checked);
    }
}

/**
 * Callback when Logarithmic y-axis is checked/unchecked
 */
function logscaleY() {
    if (panelOptions.logscaleYFunction) {
        panelOptions.logscaleYFunction(panelOptions.logscaleYCheckbox.checked);
    }
}

/**
 * Callback when Stacked Plot is checked/unchecked
 */
function stackedPlot() {
    console.log("running stackedPlot");
    if (panelOptions.stackedPlotFunction) {
        panelOptions.stackedPlotFunction(panelOptions.stackedPlotCheckbox.checked);
    }
}

/**
 * Callback when a new variables (design, objective, constraint, etc) is selected
 * or de-selected.
 * 
 * @param {String} variable 
 * @param {Bool} val 
 * @param {String} type 
 */
function variablesSelected(variable, val, type) {
    console.log("running variablesSelected");
    if (panelOptions.variablesFunction) {
        panelOptions.variablesFunction(variable, val, type);
    }
}

//Structure that keeps track of all of the elements and methods used
// for the current plot
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

//Set the callback for selected a design variable
$('#designVariablesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.designVariables[clickedIndex], newValue, 'desvar');
});

//Set the callback for selecting an objective
$('#objectivesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.objectives[clickedIndex], newValue, 'objective');
});

//Set the constraint for selecting a constraint
$('#constraintsSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.constraints[clickedIndex], newValue, 'constraint');
});