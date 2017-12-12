"use strict";

var createPlot = function (container, componentState) {
    //Constants telling the height/weidth for plotly
    var deltaPlotheight = 20;
    var deltaSearchWidth = 100;

    var curData = []; //The data currently being plotted. In format Plotly expects
    var plotlyElement = container.getElement()[0].lastChild; //The plotly HTML element
    var options = container.getElement()[0].children[0]; //The button to open the options sidebar
    var dataInUse = {}; //Set of names telling what data is in use
    var originalData = {}; //Set of the original data?

    //Indicates if we need to update/save the config to the server
    var needSave = false;

    //Set the original plotly width/height
    if (container.width != null) {
        plotlyElement.style.width = container.width.toString() + 'px';
        plotlyElement.style.height = (container.height - deltaPlotheight).toString() + 'px';
    }

    //Arrays that keep track of the design variables, constraints, objectives, sysincludes
    // and their values
    var designVariables = [];
    var constraints = [];
    var objectives = [];
    var sysincludes = [];

    //Maps promoted variable names to absolute variable names and vice versa
    var prom2abs = {'input': {}, 'output': {}};
    var abs2prom = {'input': {}, 'output': {}};

    //Setup control panel
    if (options != null) {
        options.onclick = function () {
            onDoubleClick();
        }
    }

    //Set up the basic plot
    if (plotlyElement != null) {
        Plotly.plot(plotlyElement, [{
            x: [1, 2, 3, 4, 5],
            y: [0, 0, 0, 0, 0]
        }],
            { margin: { t: 0 } }
        );
    }

    /**
     * Function which is called when the window is resized.
     * Resets the dimensions for plotly
     */
    var resize = function () {
        //Set plotlyElement's dimensions
        plotlyElement.style.width = container.width.toString() + 'px';
        plotlyElement.style.height = (container.height - deltaPlotheight).toString() + 'px';

        //Set up plotly's dimensions
        Plotly.relayout(plotlyElement, {
            width: container.width,
            height: container.height - deltaPlotheight
        });
    };

    /**
     * Function which sets plot's data. Searches through to determine
     * which values to show (based on selected indices), then updates plotly
     * 
     * @param {[Object]} dat 
     */
    var setData = function (dat, variable) {
        curData = [];
        originalData[variable] = dat;

        //Place everything in the data array
        for (var i = 0; i < dat.length; ++i) {
            var indexOfIterType = getIndexOfIterType(dat[i]['iteration']);
            if (indexOfIterType == -1) {
                curData.push([dat[i]]);
            }
            else {
                curData[indexOfIterType].push(dat[i]);
            }
        }

        //Determine which data set to plot by default
        var largestCount = -1;
        var index = -1;
        for (var i = 0; i < curData.length; ++i) {
            if (curData[i].length > largestCount) {
                largestCount = curData.length;
                index = i;
            }
        }

        var finalData = setNewPlotData(index, variable);
        updateArraysInControlPanel(finalData, variable);
        dataInUse[variable] = finalData;
        updatePlotly(dataInUse);
    };

    /**
     * Called when the selectPicker is clicked. Updates plot with new data.
     * 
     * NOTE: Currently not used - select picker has been taken out for the moment
     */
    var selectClicked = function () {
        var index = Number(selectPicker.value);
        var finalData = setNewPlotData(index);
        updatePlotly(finalData);
    }
    // selectPicker.onchange = selectClicked;

    /**
     * Sorts and formats data at the given index of curData, then 
     * plots it
     * 
     * @param {int} index 
     */
    var setNewPlotData = function (index, variableName) {
        //Sort the data to be plotted
        curData[index].sort(compareIterations);

        //Set up data for plotting
        // var finalData = formatData(index, function (obj) { return obj['type'] == 'input' || obj['type'] == 'output' });
        var finalData = formatData(index, function (obj) { return obj['type'] == 'desvar' }, variableName + ' ');
        var objectivesT = formatData(index, function (obj) { return obj['type'] == 'objective' }, variableName + ' ');
        var constraintT = formatData(index, function (obj) { return obj['type'] == 'constraint' }, variableName + ' ');
        var sysincludesT = formatData(index, function (obj) { return obj['type'] == 'sysinclude' }, variableName + ' ');
        append(finalData, objectivesT);
        append(finalData, constraintT);
        append(finalData, sysincludesT);

        //Set the precision of the data
        for (var j = 0; j < finalData.length; ++j) {
            for (var i = 0; i < finalData[j].y.length; ++i) {
                var val = finalData[j].y[i];
                val = Math.round(val * 100000000) / 100000000;
                finalData[j].y[i] = val;
                finalData[j].x[i] = parseInt(finalData[j].x[i]) - 1;
            }
        }

        return finalData;
    }

    /**
     * Updates plotly to plot the new data
     * 
     * @param{[Object]} finalData - the data to be plotted
     */
    var updatePlotly = function (data) {
        var finalData = [];

        data = extractBasedOnIndices(data);

        var titleString = '';
        for (var k in data) {
            titleString += abs2prom.output[k] + ' '
            for (var n = 0; n < data[k].length; ++n) {
                finalData.push(data[k][n]);
                finalData[finalData.length - 1]['type'] = 'scatter';
            }
        }

        titleString += " vs. Iterations"

        //Set up the layout
        var xaxis = {
            title: 'Iteration'
        }

        var yaxis = {
            title: 'Value'
        }

        if (componentState.stackedPlotVal) { yaxis.title = ''; }

        if (componentState.logscaleXVal) {
            xaxis['type'] = 'log'
        }
        if (componentState.logscaleYVal) {
            yaxis['type'] = 'log'
        }

        var layout = {
            title: titleString,
            xaxis: xaxis,
            yaxis: yaxis
        };

        //Deal with stacked plots
        if (componentState.stackedPlotVal) {
            updateForStackedPlots(finalData, layout);
        }
        else { //delete the old y-axis values if you used stacked plots previously
            for (var i = 0; i < finalData.length; ++i) {
                delete finalData[i].yaxis;
            }
        }

        //plot it
        Plotly.newPlot(plotlyElement, finalData, layout);
    }

    /**
     * Sorts through the data that's ready for plotly and removes
     * any data that shouldn't be shown based on the user's selected indices.
     * 
     * @param {*} data 
     * @returns {[*]}
     */
    var extractBasedOnIndices = function (data) {
        var ret = {};

        for (var d in data) {
            var ind = findVariableInIndices(d);

            if (ind != null) {
                ret[d] = [];

                //Go over each index and see if it's in
                // the index set (the set of indexes to be plotted).
                // if so, add it to our return array
                for (var i = 0; i < data[d].length; ++i) {
                    if (ind.indexSet.indexOf(i) >= 0) {
                        ret[d].push(data[d][i]);
                    }
                }
            }
            else { //otherwise it isn't in variableIndices and isn't restricted
                ret[d] = data[d];
            }
        }

        return ret;
    }

    /**
     * Searches through the variableIndices DS to find and return 
     * the associated variable index object.
     * 
     * @param {String} name 
     * @returns {*} object if found, null otherwise
     */
    var findVariableInIndices = function (name) {
        for (var i = 0; i < componentState.variableIndices.length; ++i) {
            if (componentState.variableIndices[i].name === name) {
                return componentState.variableIndices[i];
            }
        }

        return null;
    }

    /**
     * Updates the data and layout to switch the plot over to 
     * a stacked plot. Should keep variables which are arrays in the
     * same row.
     * 
     * @param {*} data 
     * @param {Object} curLayout 
     */
    var updateForStackedPlots = function (data, curLayout) {
        //Set the y axis for each of data set and get the total number of unique variables
        var prevYIndex = 1;
        curLayout['shapes'] = [];

        for (var i = 1; i < data.length; ++i) {
            if (checkIfNewVariable(data[i].name, data[i - 1].name)) {
                ++prevYIndex;
            }

            //if prevYIndex == 1, then we're on the first variable, which isn't given a number
            data[i]['yaxis'] = 'y' + (prevYIndex == 1 ? '' : prevYIndex.toString());
        }

        //Use prevYIndex as proxy for number of unique variables
        var numVars = prevYIndex;
        var delta = 1.0 / numVars;
        curLayout['yaxis']['domain'] = [0, delta];

        //Set layout
        for (var i = 2; i <= numVars; ++i) {
            curLayout['yaxis' + i.toString()] = {
                domain: [delta * (i - 1), delta * i]
            }
            curLayout['shapes'].push({
                'type': 'line',
                'x0': 0,
                'y0': delta * (i - 1),
                'x1': 1,
                'y1': delta * (i - 1),
                'xref': 'paper',
                'yref': 'paper',
                'opacity': '0.8',
                'line': {
                    'color': '#444444',
                    'width': 2.5,
                    'dash': 'dot'
                }
            });

            if (componentState.logscaleYVal) {
                curLayout['yaxis' + i.toString()]['type'] = 'log';
            }
        }
    }

    /**
     * Finds the max in a set
     * 
     * @param {[Number]} dataset 
     */
    var max = function (dataset) {
        var cur = Number.MIN_VALUE;
        for (var i = 0; i < dataset.length; ++i) {
            var num = Number(dataset[i])
            if (num > cur) { cur = num; }
        }

        return cur;
    }

    /**
     * Finds the min in a set
     * @param {[Number]} dataset 
     */
    var min = function (dataset) {
        var cur = Number.MAX_VALUE;
        for (var i = 0; i < dataset.length; ++i) {
            var num = Number(dataset[i])
            if (num < cur) { cur = num; }
        }

        return cur;
    }

    /**
     * Checks if a given variable name is a new variable
     * or simply another index of a variable that is already being used in 'data'
     * 
     * Used by updateForStackedPlots
     * 
     * @param {String} name 
     * @returns {Boolean} true if it's new, false if it's already used in 'data'
     */
    var checkIfNewVariable = function (name, prev) {
        //Convert name from 'name[x][y][z]' to 'name|x|y|z|'
        var alteredName = name.replace(/\[/g, "|");
        alteredName = alteredName.replace(/]/g, "|");
        alteredName = alteredName.replace(/\|\|/g, "|");

        var alteredPrev = prev.replace(/\[/g, "|");
        alteredPrev = alteredPrev.replace(/]/g, "|");
        alteredPrev = alteredPrev.replace(/\|\|/g, "|");

        //Split so we get ['name', 'x', 'y', 'z']
        var splitName = alteredName.split("|");
        var splitPrev = alteredPrev.split("|");

        //Check the names. If they're different, then we have a new variable
        if (splitName[0] !== splitPrev[0]) { return true; }

        return false;
    }

    /**
     * Appends array2 onto array1
     * 
     * @param {[*]} arr1 
     * @param {[*]} arr2 
     */
    var append = function (arr1, arr2) {
        for (var i = 0; i < arr2.length; ++i) {
            arr1.push(arr2[i])
        }
    }

    /**
     * Pulls out the data at the given index from curData and returns
     * it in a format that's friendly for Plotly
     * 
     * NOTE: In the current state, it is needlessly complex dealing with variable
     *  arrays and arrays of arrays. Should find a generic way to do this that's
     *  a bit cleaner.
     * 
     * @param {int} index
     * @return {Object}
     */
    var formatData = function (index, typeFunc, prependName = '') {
        var finalData = [];
        var gotFirstProp = false;
        for (var i = 0; i < curData[index].length; ++i) {
            for (var j = 0; j < curData[index][i]['values'].length; ++j) {
                if (curData[index][i]['values'][0].hasOwnProperty('length')) {
                    for (var k = 0; k < curData[index][i]['values'][0].length; ++k) {
                        if (typeFunc(curData[index][i]) && !gotFirstProp) {
                            gotFirstProp = true;
                            finalData.push({
                                x: [curData[index][i]['counter']],
                                y: [curData[index][i]['values'][j][k]],
                                name: prependName + '[0][0]'
                            });
                        }
                        else {
                            if (typeFunc(curData[index][i])) {
                                var k_len = curData[index][i]['values'][0].length;
                                finalData[k_len * j + k].x.push(curData[index][i]['counter']);
                                finalData[k_len * j + k].y.push(curData[index][i]['values'][j][k]);
                                finalData[k_len * j + k].name = prependName + '[' + j + '][' + k + ']';
                            }
                        }
                    }
                }
                else {
                    if ((typeFunc(curData[index][i]) && !gotFirstProp) ||
                        (typeFunc(curData[index][i]) && j >= finalData.length)) {
                        gotFirstProp = true;
                        finalData.push({
                            x: [curData[index][i]['counter']],
                            y: [curData[index][i]['values'][j]],
                            name: prependName + '[' + j + ']'
                        });
                    }
                    else {
                        if (typeFunc(curData[index][i])) {
                            finalData[j].x.push(curData[index][i]['counter']);
                            finalData[j].y.push(curData[index][i]['values'][j]);
                            finalData[j].name = prependName + '[' + j + ']';
                        }
                    }
                }
            }
        }

        return finalData;
    }

    /**
     * Returns the iteration name, which is the sum of the names in the
     * iteration array.
     * 
     * @param {Iteration} iteration 
     * @return {String}
     */
    var getIterationName = function (iteration) {
        var s = "";
        if (iteration === null) return s;
        s += iteration['iteration'][0].name;
        for (var i = 1; i < iteration['iteration'].length; ++i) {
            s += '::' + iteration['iteration'][i].name;
        }
        return s;
    }

    /**
     * Compares two iterations by their counter. Returns
     *  1 if a > b, -1 if a < b, and 0 if they're equal.
     * 
     * @param {Iteration} a 
     * @param {Iteration} b 
     * @return {int}
     */
    var compareIterations = function (a, b) {
        if (a['counter'] > b['counter']) {
            return 1;
        }
        else if (b['counter'] > a['counter']) {
            return -1;
        }

        return 0;
    }

    /**
     * Checks to see if curData already has a similar iteration.
     * Algorithm:
     *  1. Check to see if there's anything in curData that has the same
     *      iteration length
     *  2. If something does, check to make sure the iteration names are the same
     *  3. If the names are the same, return the index
     *  4. Otherwise, return -1
     * 
     * @param {Object} iter 
     * @return {int}
     */
    var getIndexOfIterType = function (iter) {
        for (var i = 0; i < curData.length; ++i) {
            var tempIter = curData[i][0]['iteration'];
            var found = true;
            if (tempIter.length == iter.length) {
                for (var j = 0; j < tempIter.length; ++j) {
                    if (tempIter[j]['name'] != iter[j]['name']) {
                        found = false;
                        break;
                    }
                }

                if (found) {
                    return i;
                }
            }
        }

        return -1;
    };

    /**
     * Attempts to get the data with the given name and
     * plot it.
     * 
     * @param {string} name 
     */
    var handleSearch = function (name, type) {
        needSave = true;

        http.get('case/' + case_id + '/driver_iterations/' + name, function (result) {
            result = JSON.parse(result);
            if (type === 'desvar') {
                componentState.selectedDesignVariables.push(name);
            }
            if (type === 'constraint') {
                componentState.selectedConstraints.push(name);
            }
            if (type === 'objective') {
                componentState.selectedObjectives.push(name);
            }
            if (type === 'sysinclude') {
                componentState.selectedSysincludes.push(name);
            }

            setData(result, name);
        });
    };

    /**
     * Callback function when logscale x is selected
     * 
     * @param {Boolean} val 
     */
    var logscaleX = function (val) {
        componentState.logscaleXVal = val;
        needSave = true;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function when logscale y is selected
     * 
     * @param {Boolean} val 
     */
    var logscaleY = function (val) {
        componentState.logscaleYVal = val;
        needSave = true;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function to use stacked plots
     * 
     * @param {Boolean} val 
     */
    var stackedPlot = function (val) {
        console.log("Changing stackedPlot to: " + val);
        needSave = true;
        componentState.stackedPlotVal = val;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function when a variable is selected or de-selected in the
     *  control panel.
     * 
     * @param {*} variable - the variable name
     * @param {*} val - added or deleted
     * @param {*} type - type of variable
     */
    var variableFun = function (variable, val, type) {
        needSave = true;
        console.log("variableFun called");
        if (val) {
            handleSearch(variable, type);
        }
        else {
            tryRemoveVariableFromIndices(variable);
            delete dataInUse[variable];
            var set = componentState.selectedDesignVariables;
            if (type === 'objective') {
                set = componentState.selectedObjectives;
            }
            else if (type === 'constraint') {
                set = componentState.selectedConstraints;
            }
            else {
                set = componentState.selectedSysincludes;
            }

            var index = set.indexOf(variable);
            if (index > -1) {
                set.splice(index, 1);
            }
            updatePlotly(dataInUse);
        }
    }

    /**
     * Changes the indices which are shown for the given variable
     * 
     * @param {String} name 
     * @param {String} val 
     */
    var variableIndicesFun = function (name, val) {
        needSave = true;
        var ind = null;
        for (var i = 0; i < componentState.variableIndices.length; ++i) {
            if (componentState.variableIndices[i].name === name) {
                ind = componentState.variableIndices[i];
                break;
            }
        }

        if (ind !== null) {
            ind.indices = val;
            addIndicesToObject(ind);
            updatePlotly(dataInUse);
        }
        console.log("Variable Indices Function called");
    }

    /**
     * Checks if a variable is an array type and, if so, updates the 
     * control panel to give an indices input
     * 
     * @param {*} data
     * @param {String} name
     */
    var updateArraysInControlPanel = function (data, name) {
        //If data's length is > 1 then we're dealing with an array variable
        if (data.length > 1) {
            var newIndices = {
                'name': name,
                'indices': '0-' + (data.length - 1).toString()
            };
            addIndicesToObject(newIndices);
            componentState.variableIndices.push(newIndices);
            addVariableIndicesGroup(newIndices.name, newIndices.indices);
        }

        console.log(data);
    }

    /**
     * Tries to remove a variable from its indices grouping and
     * removes it from the control panel
     * 
     * @param {String} name
     */
    var tryRemoveVariableFromIndices = function (name) {
        for (var i = 0; i < componentState.variableIndices.length; ++i) {
            if (componentState.variableIndices[i].name === name) {
                removeVariableIndicesGroup(name);
                componentState.variableIndices.splice(i, 1);
            }
        }
    }

    /**
     * Adds the 'indexSet' parameter to the given 
     * varIndices object
     * 
     * @param {*} varIndices 
     */
    var addIndicesToObject = function (varIndices) {
        varIndices['indexSet'] = [];
        var splitIndices = varIndices.indices.replace(/ /g, ''); //remove spaces
        splitIndices = splitIndices.split(',');

        for (var i = 0; i < splitIndices.length; ++i) {
            var cur = splitIndices[i];
            if (!isNaN(cur)) { //If we're just dealing with a number
                varIndices.indexSet.push(Number(cur));
            }
            else { //If we're dealing with something of the form '0-9'
                var splitCur = cur.split('-');
                var start = Number(splitCur[0]); //first number
                var end = Number(splitCur[1]);   //last number

                for (var j = start; j <= end; ++j) {
                    varIndices.indexSet.push(j);
                }
            }
        }
    }

    /**
     * Tries to update each variable in the plot by setting the 'cur_max_count' header
     */
    var tryUpdateVariables = function () {
        //Try to update the variables
        for (var variable in originalData) {
            var maxCount = 0;

            //Find max count in data
            for (var i = 0; i < originalData[variable].length; ++i) {
                var curCount = originalData[variable][i]['counter'];
                if (curCount > maxCount) {
                    maxCount = curCount;
                }
            }

            //set the header for the request
            var headers = [{
                'name': 'cur_max_count',
                'value': maxCount
            }];

            //Send the request to see if data needs to be updated
            http.get('case/' + case_id + '/driver_iterations/' + variable, function (result) {
                result = JSON.parse(result);
                if (result.length > 0) { //if data needs to be updated, update
                    setData(result, variable);
                }
            }, null, headers);
        }
    }

    //Get abs2prom and prom2abs metadata
    http.get('case/' + case_id + '/metadata', function (result) {
        if (result !== "[]" && result !== "null") {
            abs2prom = result.abs2prom;
            prom2abs = result.prom2abs;
        }

        //Get the designVariables
        http.get('case/' + case_id + '/desvars', function (result) {
            result = JSON.parse(result);
            designVariables = [];
            objectives = [];
            constraints = [];
            sysincludes = [];
            for (var i = 0; i < result.length; ++i) {
                var name = result[i]['name'];

                //Map to yourself just in case we don't have the metadata
                if(!(name in prom2abs['output'])) { prom2abs['output'][name] = name; }
                if(!(name in abs2prom['output'])) { abs2prom['output'][name] = name; }

                if (result[i]['type'] === 'desvar') {
                    designVariables.push(name);
                }
                else if (result[i]['type'] === 'objective') {
                    objectives.push(name);
                }
                else if (result[i]['type'] === 'sysinclude') {
                    sysincludes.push(name);
                }
                else {
                    constraints.push(name);
                }
            }

            if (componentState.selectedConstraints.length > 0 || componentState.selectedDesignVariables.length > 0 ||
                componentState.selectedSysincludes.length > 0 || componentState.selectedObjectives.length > 0) {
                //Create temporary arrays so we can iterate and change the original arrays
                var tempConstraints = componentState.selectedConstraints;
                var tempDesvars = componentState.selectedDesignVariables;
                var tempSysincludes = componentState.selectedSysincludes;
                var tempObjectives = componentState.selectedObjectives;

                //Reset all arrays (they'll be set when we do 'handleSearch')
                componentState.selectedConstraints = [];
                componentState.selectedDesignVariables = [];
                componentState.selectedSysincludes = [];
                componentState.selectedObjectives = [];

                for (var i = 0; i < tempConstraints.length; ++i) {
                    handleSearch(tempConstraints[i], 'constraint');
                }
                for (var i = 0; i < tempDesvars.length; ++i) {
                    handleSearch(tempDesvars[i], 'desvar');
                }
                for (var i = 0; i < tempSysincludes.length; ++i) {
                    handleSearch(tempSysincludes[i], 'sysinclude');
                }
                for (var i = 0; i < tempObjectives.length; ++i) {
                    handleSearch(tempObjectives[i], 'objective');
                }
            }
            else {
                var randIndex = Math.floor(Math.random() * designVariables.length);
                if (randIndex < designVariables.length) {
                    handleSearch(designVariables[randIndex], 'desvar');
                }
            }
        });
    });

    /**
     * Function that opens the plot control panel if it's closed, or closes
     * it if it's already open
     */
    var onDoubleClick = function () {
        if (!controlPanelOpen) {
            openNav(componentState.logscaleXVal, componentState.logscaleYVal, componentState.stackedPlotVal, designVariables,
                objectives, constraints, sysincludes, componentState.selectedDesignVariables, componentState.selectedObjectives,
                componentState.selectedConstraints, componentState.selectedSysincludes, variableIndices,
                logscaleX, logscaleY, stackedPlot, variableFun, variableIndicesFun, abs2prom, prom2abs);
        }
        else {
            closeNav();
        }
    }

    //Start trying to update the variables so data is live
    setInterval(tryUpdateVariables, 5000);

    //Start trying ot save
    setInterval(function () {
        if (needSave) {
            needSave = false;
            saveLayout(null);
        }
    }, 3000)

    //Set plotly's event listener to open/close the control panel
    plotlyElement.addEventListener('dblclick', onDoubleClick);

    //Set callback on resize
    container.on('resize', resize);

    //Add to layout's configCallbacks so we update our componentState
    // on the server.
    configCallbacks.push(function () {
        return componentState;
    });
};
