/**
 * Class ControlPanel - functions and DSs to interact with the side control panel
 */
function ControlPanel() {
    // ******************* Local Variables ******************* //

    const desvarSelection = $('#designVariablesSelection');
    const objSelection = $('#objectivesSelection');
    const constSelection = $('#constraintsSelection');
    const otherSelection = $('#othersSelection');
    const changedEvent = 'changed.bs.select';

    //Structure that keeps track of all of the elements and methods used
    // for the current plot
    let panelOptions = {
        logscaleXFunction: (name, val) => {},
        logscaleYFunction: (name, val) => {},
        stackedPlotFunction: (name, val) => {},
        variablesFunction: (name, val, type) => {},
        variableIndicesFunction: (name, val) => {},

        logscaleXCheckbox: document.getElementById('logscaleXCheckbox'),
        logscaleYCheckbox: document.getElementById('logscaleYCheckbox'),
        stackedPlotCheckbox: document.getElementById('stackedPlotCheckbox'),
        designVariablesSelector: document.getElementById(
            'designVariablesSelection'
        ),
        objectivesSelector: document.getElementById('objectivesSelection'),
        constraintsSelector: document.getElementById('constraintsSelection'),
        othersSelector: document.getElementById('othersSelection')
    };

    // ******************* Public Methods ******************* //

    /**
     * Opens the control panel and initializes all values in the panel
     *
     * @param {boolean} logscaleXValue - whether or not we're using logscale on x-axis
     * @param {boolean} logscaleYValue - whether or not we're using logscale on y-axis
     * @param {boolean} stackedPlotValue - whether or not we're using stacked plots
     * @param {[String]} designVariables -list of names of design vars
     * @param {[String]} objectives - list of names of objectives
     * @param {[String]} constraints - list of names of constraints
     * @param {[String]} sysincludes - list of names of all other vars
     * @param {[String]} checkedDesignVariables - list of names of desvars being plotted
     * @param {[String]} checkedObjectives - list of names of objectives being plotted
     * @param {[String]} checkedConstraints - list of names of constraints being plotted
     * @param {[String]} checkedSysincludes - list of names of other vars being plotted
     * @param {[{name: string, indices: string}]} variableIndexValues - set of variables and their plotted indices
     * @param {function} logscaleXFunction - callback when user checks or unchecks x-axis logscale
     * @param {function} logscaleYFunction - callback when user checks or unchecks y-axis logscale
     * @param {function} stackedPlotFunction - callback when user checks or unchecks stacked plots
     * @param {function} variablesFunction - callback when user selects or deselects variables to plot
     * @param {function} variableIndicesFunction - callback when user changes indices to be plotted
     * @param {[*]} abs2prom - map of absolute variable names to promoted names
     * @param {[*]} prom2abs - map of promoted variable names to absolute names
     */
    this.openNav = function(
        logscaleXValue,
        logscaleYValue,
        stackedPlotValue,
        designVariables,
        objectives,
        constraints,
        sysincludes,
        checkedDesignVariables,
        checkedObjectives,
        checkedConstraints,
        checkedSysincludes,
        variableIndexValues,
        logscaleXFunction,
        logscaleYFunction,
        stackedPlotFunction,
        variablesFunction,
        variableIndicesFunction,
        abs2prom,
        prom2abs
    ) {
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
        panelOptions.abs2prom = abs2prom;
        panelOptions.prom2abs = prom2abs;

        //Remove all previous variables from the dropdowns
        updateDropdowns(
            panelOptions.designVariablesSelector,
            '#designVariablesSelection',
            designVariables,
            checkedDesignVariables
        );
        updateDropdowns(
            panelOptions.objectivesSelector,
            '#objectivesSelection',
            objectives,
            checkedObjectives
        );
        updateDropdowns(
            panelOptions.constraintsSelector,
            '#constraintsSelection',
            constraints,
            checkedConstraints
        );
        updateDropdowns(
            panelOptions.othersSelector,
            '#othersSelection',
            sysincludes,
            checkedSysincludes
        );

        //Get rid of all of the variable index inputs and add the new ones
        resetVariableIndices();
        for (var i = 0; i < variableIndexValues.length; ++i) {
            this.addVariableIndicesGroup(
                variableIndexValues[i].name,
                variableIndexValues[i].indices
            );
        }

        document.getElementById('plotControls').style.display = 'block';
    };

    /**
     * Removes the available input from the control panel
     * which corresponds to the given variable name
     *
     * @param {String} name
     */
    this.removeVariableIndicesGroup = function(name) {
        var element = document.getElementById('div_' + name);
        if (element != null) {
            element.outerHTML = '';
        }
    };

    /**
     * Adds an input for the variable indices on the control panel
     *
     * @param {String} name
     * @param {String} curIndices
     */
    this.addVariableIndicesGroup = function(name, curIndices) {
        let content =
            "<div id='div_" +
            name +
            "'><br/>\r\n<div class='form-group' style='padding-right: 25px'>\r\n" +
            "<div class='sidebarBodyPlots reduceWidth'> " +
            name +
            " Indices <button type='button' class='btn btn-sm btn-primary' data-toggle='modal' data-target='#selectIndicesModal'><span class='fas fa-info-circle'></span></button></div>\r\n" +
            "<input type='text' class='form-control varname reducedWidth' style='width: 60%' value=\"" +
            curIndices +
            '" id=\'var_' +
            name +
            "' onchange='controlPanel.indicesChanged(\"" +
            name +
            '", document.getElementById("' +
            'var_' +
            name +
            '").value)\'>\r\n' +
            '</div></div>\r\n';

        let variableIndicesDiv = document.getElementById('variableIndices');
        variableIndicesDiv.innerHTML += content;
    };

    // ******************* Callbacks ******************* //

    /**
     * Callback when Logarithmic x-axis is checked/unchecked
     */
    this.logscaleX = function() {
        if (panelOptions.logscaleXFunction) {
            panelOptions.logscaleXFunction(
                panelOptions.logscaleXCheckbox.checked
            );
        }
    };

    /**
     * Callback when Logarithmic y-axis is checked/unchecked
     */
    this.logscaleY = function() {
        if (panelOptions.logscaleYFunction) {
            panelOptions.logscaleYFunction(
                panelOptions.logscaleYCheckbox.checked
            );
        }
    };

    /**
     * Callback when Stacked Plot is checked/unchecked
     */
    this.stackedPlot = function() {
        console.log('running stackedPlot');
        if (panelOptions.stackedPlotFunction) {
            panelOptions.stackedPlotFunction(
                panelOptions.stackedPlotCheckbox.checked
            );
        }
    };

    /**
     * Callback when a variable's index input is changed
     *
     * @param {String} name
     * @param {String} val
     */
    this.indicesChanged = function(name, val) {
        console.log(name + "'s indices were updated to " + val);
        let valWithoutSpaces = val.replace(/ /g, '');

        //regex to make sure the input matches our expectation
        // expectation is somehwere along the lines of: x-y, z (where x, y and z are integers in the string)
        const rgx = /^[0-9]+(\-[0-9]+){0,1}(,[0-9]+(\-[0-9]+){0,1})*$/;
        if (rgx.test(valWithoutSpaces)) {
            let input = document.getElementById('div_' + name);
            input.className = 'form-group';
            if (panelOptions.variableIndicesFunction) {
                panelOptions.variableIndicesFunction(name, val);
            }
        } else {
            //find element and add 'has-error'
            let input = document.getElementById('div_' + name);
            if (input.className.indexOf('has-error') < 0) {
                input.className += ' has-error';
            }
        }
    };

    // ******************* Private Helper Methods ******************* //

    /**
     * Removes everything that was previously in the dropdown and replaces it with the new
     * given values.
     *
     * @param {*} selector
     * @param {String} queryName
     * @param {[String]} vars
     * @param {[String]} checkedVals
     */
    function updateDropdowns(selector, queryName, vars, checkedVals) {
        selector.options = [];
        selector.options.length = 0;
        for (var i = 0; i < selector.options.length; ++i) {
            selector.options[i] = null;
        }
        $(queryName).selectpicker('refresh');

        //Add the variables to their dropdowns
        for (var i = 0; i < vars.length; ++i) {
            var option = new Option(
                panelOptions.abs2prom.output[vars[i]],
                vars[i]
            );
            selector.options.add(option);
        }

        //Refresh dropdowns
        $(queryName).selectpicker('refresh');

        //Set the checked values for each dropdown
        $(queryName).selectpicker('val', checkedVals);
    }

    /**
     * Callback when a new variables (design, objective, constraint, etc) is selected
     * or de-selected.
     *
     * @param {String} variable
     * @param {boolean} val
     * @param {String} type
     */
    function variablesSelected(variable, val, type) {
        console.log('running variablesSelected');
        if (panelOptions.variablesFunction) {
            panelOptions.variablesFunction(variable, val, type);
        }
    }

    /**
     * Resets the innerHTMl for the variable indices div
     */
    function resetVariableIndices() {
        var variableIndicesDiv = document.getElementById('variableIndices');
        variableIndicesDiv.innerHTML = '';
    }

    // ******************* Set Event Callbacks ******************* //

    //Set the callback for selecting a design variable
    desvarSelection.on(changedEvent, function(
        e,
        clickedIndex,
        newValue,
        oldValue
    ) {
        variablesSelected(
            panelOptions.designVariables[clickedIndex],
            newValue,
            'desvar'
        );
    });

    //Set the callback for selecting an objective
    objSelection.on(changedEvent, function(
        e,
        clickedIndex,
        newValue,
        oldValue
    ) {
        variablesSelected(
            panelOptions.objectives[clickedIndex],
            newValue,
            'objective'
        );
    });

    //Set the callback for selecting a constraint
    constSelection.on(changedEvent, function(
        e,
        clickedIndex,
        newValue,
        oldValue
    ) {
        variablesSelected(
            panelOptions.constraints[clickedIndex],
            newValue,
            'constraint'
        );
    });

    //Set the callback for selecting an 'other'
    otherSelection.on(changedEvent, function(
        e,
        clickedIndex,
        newValue,
        oldValue
    ) {
        variablesSelected(
            panelOptions.others[clickedIndex],
            newValue,
            'sysinclude'
        );
    });
}

const controlPanel = new ControlPanel();
