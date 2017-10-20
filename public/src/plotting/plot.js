"use strict";

var createPlot = function (container) {
    var deltaPlotheight = 20;
    var deltaSearchWidth = 100;

    var search;
    var curData = [];
    var searchString = '';
    var plotlyElement = container.getElement()[0].lastChild;
    var options = container.getElement()[0].children[0];
    var dataInUse = {};
    var originalData = {};
    plotlyElement.style.width = container.width.toString() + 'px';
    plotlyElement.style.height = (container.height - deltaPlotheight).toString() + 'px';

    var logscaleXVal = false;
    var logscaleYVal = false;
    var stackedPlotVal = false;

    var designVariables = [];
    var constraints = [];
    var objectives = [];
    var selectedDesignVariables = [];
    var selectedConstraints = [];
    var selectedObjectives = [];
    var variableIndices = [];

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
        // searchElement.style.width = (container.width - deltaSearchWidth).toString() + 'px';

        //Set up plotly's dimensions
        Plotly.relayout(plotlyElement, {
            width: container.width,
            height: container.height - deltaPlotheight
        });
    };

    /**
     * Function which sets plot's data. Searches through to determine
     * which values to show, then updates plotly
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
        append(finalData, objectivesT);
        append(finalData, constraintT);

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
            titleString += k + ' '
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

        if (stackedPlotVal) { yaxis.title = ''; }

        if (logscaleXVal) {
            xaxis['type'] = 'log'
        }
        if (logscaleYVal) {
            yaxis['type'] = 'log'
        }

        var layout = {
            title: titleString,
            xaxis: xaxis,
            yaxis: yaxis
        };

        //Deal with stacked plots
        if (stackedPlotVal) {
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
    var extractBasedOnIndices = function(data) {
        var ret = {};

        for(var d in data) {
            var ind = findVariableInIndices(d);

            if(ind != null) {
                ret[d] = [];
                
                //Go over each index and see if it's in
                // the index set (the set of indexes to be plotted).
                // if so, add it to our return array
                for(var i = 0; i < data[d].length; ++i) {
                    if(ind.indexSet.indexOf(i) >= 0) {
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
    var findVariableInIndices = function(name) {
        for(var i = 0; i < variableIndices.length; ++i) {
            if(variableIndices[i].name === name) {
                return variableIndices[i];
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
        for (var i = 1; i < data.length; ++i) {
            if (checkIfNewVariable(data[i].name)) {
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

            if (logscaleYVal) {
                curLayout['yaxis' + i.toString()]['type'] = 'log';
            }
        }
    }

    /**
     * Checks if a given variable name (including index) is a new variable
     * or simply another index of a variable that is already being used in 'data'
     * 
     * Used by updateForStackedPlots
     * 
     * @param {String} name 
     * @returns {Boolean} true if it's new, false if it's already used in 'data'
     */
    var checkIfNewVariable = function (name) {
        //Convert name from 'name[x][y][z]' to 'name|x|y|z|'
        var alteredName = name.replace(/\[/g, "|");
        alteredName = alteredName.replace(/]/g, "|");
        alteredName = alteredName.replace(/\|\|/g, "|");

        //Split so we get ['name', 'x', 'y', 'z']
        var splitName = alteredName.split("|");

        //Check the numbers. If we get one that's greater than 0, then this isn't
        // a new variable
        for (var i = 0; i < splitName.length; ++i) {
            if (!isNaN(splitName[i])) {
                if (splitName[i] > 0) { return false; }
            }
        }

        return true;
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
                            name: prependName + '[0]'
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
        http.get('case/' + case_id + '/driver_iterations/' + name, function (result) {
            result = JSON.parse(result);
            searchString = name;
            if (type === 'desvar') {
                selectedDesignVariables.push(name);
            }
            if (type === 'constraint') {
                selectedConstraints.push(name);
            }
            if (type === 'objective') {
                selectedObjectives.push(name);
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
        logscaleXVal = val;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function when logscale y is selected
     * 
     * @param {Boolean} val 
     */
    var logscaleY = function (val) {
        logscaleYVal = val;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function to use stacked plots
     * 
     * @param {Boolean} val 
     */
    var stackedPlot = function (val) {
        console.log("Changing stackedPlot to: " + val);
        stackedPlotVal = val;
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
        console.log("variableFun called");
        if (val) {
            handleSearch(variable, type);
        }
        else {
            tryRemoveVariableFromIndices(variable);
            delete dataInUse[variable];
            var set = selectedDesignVariables;
            if (type === 'objective') {
                set = selectedObjectives;
            }
            else if (type === 'constraint') {
                set = selectedConstraints;
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
        var ind = null;
        for (var i = 0; i < variableIndices.length; ++i) {
            if (variableIndices[i].name === name) {
                ind = variableIndices[i];
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
            variableIndices.push(newIndices);
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
        for (var i = 0; i < variableIndices.length; ++i) {
            if (variableIndices[i].name === name) {
                removeVariableIndicesGroup(name);
                variableIndices.splice(i, 1);
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
        splitIndices = varIndices.indices.split(',');

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

    //Get the designVariables
    http.get('case/' + case_id + '/desvars', function (result) {
        result = JSON.parse(result);
        designVariables = [];
        objectives = [];
        constraints = [];
        for (var i = 0; i < result.length; ++i) {
            if (result[i]['type'] === 'desvar') {
                designVariables.push(result[i]['name']);
            }
            else if (result[i]['type'] === 'objective') {
                objectives.push(result[i]['name']);
            }
            else {
                constraints.push(result[i]['name']);
            }
        }

        var randIndex = Math.floor(Math.random() * designVariables.length);
        if (randIndex < designVariables.length) {
            handleSearch(designVariables[randIndex], 'desvar');
        }
    });

    /**
     * Function that opens the plot control panel if it's closed, or closes
     * it if it's already open
     */
    var onDoubleClick = function () {
        // variableIndices = [
        //     {
        //         name: 'test1',
        //         indices: '0-10'
        //     },
        //     {
        //         name: 'test2',
        //         indices: '1-3, 5-10'
        //     }
        // ];

        if (!controlPanelOpen) {
            openNav(logscaleXVal, logscaleYVal, stackedPlotVal, designVariables,
                objectives, constraints, selectedDesignVariables, selectedObjectives, selectedConstraints, variableIndices,
                logscaleX, logscaleY, stackedPlot, variableFun, variableIndicesFun);
        }
        else {
            closeNav();
        }
    }

    //Start trying to update the variables so data is live
    setInterval(tryUpdateVariables, 5000);

    //Set plotly's event listener to open/close the control panel
    plotlyElement.addEventListener('dblclick', onDoubleClick);

    //Set callback on resize
    container.on('resize', resize);
};
