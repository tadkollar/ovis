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
        dataInUse[variable] = finalData;
        updatePlotly(dataInUse);
    };

    /**
     * Called when the selectPicker is clicked. Updates plot with new data
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

        var titleString = '';
        for (var k in data) {
            titleString += k + ' '
            for (var n = 0; n < data[k].length; ++n) {
                finalData.push(data[k][n]);
                finalData[finalData.length-1]['type'] = 'scatter';
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

        if(stackedPlotVal) { yaxis.title = ''; }

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

        if(stackedPlotVal) {
            var delta = 1.0 / finalData.length;
            layout['yaxis']['domain'] = [0, delta];
            for(var i = 1; i < finalData.length; ++i) {
                finalData[i]['yaxis'] = 'y' + (i+1).toString();
                layout['yaxis' + (i+1).toString()] = {
                    domain: [delta * i, delta * (i+1)]
                }

                if(logscaleYVal) {
                    finalData[i]['yaxis' + i.toString()]['type'] = 'log';
                }
            }
        }

        //plot it
        Plotly.newPlot(plotlyElement, finalData, layout);
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
     * Tries to update each variable in the plot by setting the 'cur_max_count' header
     */
    var tryUpdateVariables = function() {
        //Try to update the variables
        for(var variable in originalData) {
            var maxCount = 0;

            //Find max count in data
            for(var i = 0; i < originalData[variable].length; ++i) {
                var curCount = originalData[variable][i]['counter'];
                if(curCount > maxCount) {
                    maxCount = curCount;
                }
            }

            //set the header for the request
            headers = [{
                'name': 'cur_max_count',
                'value': maxCount
            }];

            //Send the request to see if data needs to be updated
            http.get('case/' + case_id + '/driver_iterations/' + variable, function (result) {
                result = JSON.parse(result);
                if(result.length > 0) { //if data needs to be updated, update
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

    var onDoubleClick = function () {
        if (!controlPanelOpen) {
            openNav(logscaleXVal, logscaleYVal, stackedPlotVal, designVariables,
                objectives, constraints, selectedDesignVariables, selectedObjectives, selectedConstraints,
                logscaleX, logscaleY, stackedPlot, variableFun);
        }
        else {
            closeNav();
        }
    }

    setInterval(tryUpdateVariables, 5000);

    plotlyElement.addEventListener('dblclick', onDoubleClick);

    //Set callback on resize
    container.on('resize', resize);
};