//Indicates whether or not the control panel is active
var controlPanelOpen = false;

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
 * @param {[String]} sysincludes
 * @param {[String]]} checkedDesignVariables 
 * @param {[String]]} checkedObjectives 
 * @param {[String]} checkedConstraints 
 * @param {[String]} checkedSysincludes
 * @param {*} variableIndexValues
 * @param {Method} logscaleXFunction 
 * @param {Method} logscaleYFunction 
 * @param {Method} stackedPlotFunction 
 * @param {Method} variablesFunction 
 * @param {Method} variableIndicesFunction
 */
function openNav(logscaleXValue, logscaleYValue, stackedPlotValue, designVariables, objectives, constraints, sysincludes,
    checkedDesignVariables, checkedObjectives, checkedConstraints, checkedSysincludes, variableIndexValues,
    logscaleXFunction, logscaleYFunction, stackedPlotFunction, variablesFunction, variableIndicesFunction) {
    //Set that the control panel is open
    controlPanelOpen = true;

    //Set the callback functions
    panelOptions.logscaleXFunction = logscaleXFunction;
    panelOptions.logscaleYFunction = logscaleYFunction;
    panelOptions.stackedPlotFunction = stackedPlotFunction;
    panelOptions.variablesFunction = variablesFunction;
    panelOptions.variableIndicesFunction = variableIndicesFunction;

    //Set the check boxes
    panelOptions.logscaleXCheckbox.checked = logscaleXValue;
    panelOptions.logscaleYCheckbox.checked = logscaleYValue;
    panelOptions.stackedPlotCheckbox.checked = stackedPlotValue;

    //Set variables
    panelOptions.designVariables = designVariables;
    panelOptions.objectives = objectives;
    panelOptions.constraints = constraints;
    panelOptions.others = sysincludes;

    //Remove all previous variables from the dropdowns
    panelOptions.designVariablesSelector.options = [];
    panelOptions.objectivesSelector.options = [];
    panelOptions.constraintsSelector.options = [];
    panelOptions.othersSelector.options = [];
    updateDropdowns(panelOptions.designVariablesSelector.options, '#designVariablesSelection', designVariables, checkedDesignVariables);
    updateDropdowns(panelOptions.objectivesSelector.options, '#objectivesSelection', objectives, checkedObjectives);
    updateDropdowns(panelOptions.constraintsSelector.options, '#constraintsSelection', constraints, checkedConstraints);
    updateDropdowns(panelOptions.othersSelector.options, '#othersSelection', sysincludes, checkedSysincludes);
    
    //Get rid of all of the variable index inputs and add the new ones
    resetVariableIndices();
    for (var i = 0; i < variableIndexValues.length; ++i) {
        addVariableIndicesGroup(variableIndexValues[i].name, variableIndexValues[i].indices);
    }

    //Set width and background color
    document.getElementById("mySidenav").style.width = "350px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function updateDropdowns(options, queryName, vars, checkedVals) {
    // panelOptions.designVariablesSelector.options = [];
    // panelOptions.objectivesSelector.options = [];
    // panelOptions.constraintsSelector.options = [];
    // panelOptions.othersSelector.options = [];
    for (var i = 0; i < options.length; ++i) {
        options[i] = null;
    }
    // for (var i = 0; i < panelOptions.objectivesSelector.options.length; ++i) {
    //     panelOptions.objectivesSelector.options[i] = null;
    // }
    // for (var i = 0; i < panelOptions.constraintsSelector.options.length; ++i) {
    //     panelOptions.constraintsSelector.options[i] = null;
    // }
    // for (var i = 0; i < panelOptions.othersSelector.options.length; ++i) {
    //     panelOptions.othersSelector.options[i] = null;
    // }
    // panelOptions.designVariablesSelector.options.length = 0;
    $(queryName).selectpicker('refresh');
    // $('#objectivesSelection').selectpicker('refresh');
    // $('#constraintsSelection').selectpicker('refresh');
    // $('#othersSelection').selectpicker('refresh');

    //Add the variables to their dropdowns
    for (var i = 0; i < vars.length; ++i) {
        var option = new Option(vars[i], vars[i]);
        options.add(option)
    }
    // for (var i = 0; i < objectives.length; ++i) {
    //     var option = new Option(objectives[i], objectives[i]);
    //     panelOptions.objectivesSelector.options.add(option)
    // }
    // for (var i = 0; i < constraints.length; ++i) {
    //     var option = new Option(constraints[i], constraints[i]);
    //     panelOptions.constraintsSelector.options.add(option)
    // }
    // for (var i = 0; i < sysincludes.length; ++i) {
    //     var option = new Option(sysincludes[i], sysincludes[i]);
    //     panelOptions.othersSelector.options.add(option)
    // }

    //Refresh dropdowns 
    $(queryName).selectpicker('refresh');
    // $('#objectivesSelection').selectpicker('refresh');
    // $('#constraintsSelection').selectpicker('refresh');
    // $('#othersSelection').selectpicker('refresh');

    //Set the checked values for each dropdown
    $(queryName).selectpicker('val', checkedVals)
    // $('#objectivesSelection').selectpicker('val', checkedObjectives)
    // $('#constraintsSelection').selectpicker('val', checkedConstraints)
    // $('#othersSelection').selectpicker('val', checkedSysincludes)
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

/**
 * Callback when a variable's index input is changed
 * 
 * @param {String} name 
 * @param {String} val 
 */
function indicesChanged(name, val) {
    console.log(name + "'s indices were updated to " + val);
    var valWithoutSpaces = val.replace(/ /g, '');

    //regex to make sure the input matches our expectation
    // expectation is somehwere along the lines of: x-y, z (where x, y and z are integers in the string)
    if (/^[0-9]+(\-[0-9]+){0,1}(,[0-9]+(\-[0-9]+){0,1})*$/.test(valWithoutSpaces)) {
        var input = document.getElementById('div_' + name);
        input.className = "form-group"
        if (panelOptions.variableIndicesFunction) {
            panelOptions.variableIndicesFunction(name, val);
        }
    }
    else {
        //find element and add 'text-danger
        var input = document.getElementById('div_' + name);
        input.className += " has-error"
    }
}

/**
 * Adds an input for the variable indices on the control panel
 * 
 * @param {String} name 
 * @param {String} curIndices 
 */
function addVariableIndicesGroup(name, curIndices) {
    var content = "<div id='div_" + name + "'><br/>\r\n<div class='form-group' style='padding-right: 25px'>\r\n" +
        "<label class='control-label'> " + name + " Indices <button type='button' class='btn btn-sm btn-primary' data-toggle='modal' data-target='#selectIndicesModal'><span class='glyphicon glyphicon-info-sign'></span></button></label>\r\n" +
        "<input type='text' class='form-control' value=\"" + curIndices + "\" id='var_" + name + "' onchange='indicesChanged(\"" + name + "\", document.getElementById(\"" + 'var_' + name + "\").value)'>\r\n" +
        "</div></div>\r\n";

    var variableIndicesDiv = document.getElementById('variableIndices');
    variableIndicesDiv.innerHTML += content;
}

/**
 * Removes the available input from the control panel 
 * which corresponds to the given variable name
 * 
 * @param {String} name 
 */
function removeVariableIndicesGroup(name) {
    var element = document.getElementById("div_" + name);
    element.outerHTML = "";
}

/**
 * Resets the innerHTMl for the variable indices div
 */
function resetVariableIndices() {
    var variableIndicesDiv = document.getElementById('variableIndices');
    variableIndicesDiv.innerHTML = "";
}

//Structure that keeps track of all of the elements and methods used
// for the current plot
var panelOptions = {
    logscaleXFunction: emptyMethod,
    logscaleYFunction: emptyMethod,
    stackedPlotFunction: emptyMethod,
    variablesFunction: emptyMethod,
    variableIndicesFunction: emptyMethod,

    logscaleXCheckbox: document.getElementById('logscaleXCheckbox'),
    logscaleYCheckbox: document.getElementById('logscaleYCheckbox'),
    stackedPlotCheckbox: document.getElementById('stackedPlotCheckbox'),
    designVariablesSelector: document.getElementById('designVariablesSelection'),
    objectivesSelector: document.getElementById('objectivesSelection'),
    constraintsSelector: document.getElementById('constraintsSelection'),
    othersSelector: document.getElementById('othersSelection')
};

//Set the callback for selected a design variable
$('#designVariablesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.designVariables[clickedIndex], newValue, 'desvar');
});

//Set the callback for selecting an objective
$('#objectivesSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.objectives[clickedIndex], newValue, 'objective');
});

//Set the callback for selecting a constraint
$('#constraintsSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.constraints[clickedIndex], newValue, 'constraint');
});

//Set the callback for selecting an 'other'
$('#othersSelection').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    variablesSelected(panelOptions.others[clickedIndex], newValue, 'sysinclude');
});
