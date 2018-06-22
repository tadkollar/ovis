'use strict';

/**
 * Class Plot - Handles getting, plotting, and updating plot data
 *
 * Note on componentState: this object tracks the state of the plot
 *  including selected variables and indices. This is the object
 *  that's saved and loaded to ensure that plots remain consistent
 *  between runs of the OVis application.
 */
function Plot(container, componentState) {
    // ******************* Local Variables ******************* //

    // Constants
    const deltaPlotHeight = 0;
    const checkUpdateVarsIntervalTime = 5000;
    const saveIntervalTime = 3000;

    // Vars updated/used throughout plotting
    let curData = []; // The data currently being plotted. In format Plotly expects
    let plotlyElement = container.getElement()[0].lastChild; // The plotly HTML element
    let options = container.getElement()[0].children[0]; // The button to open the options sidebar
    let dataInUse = {}; // Set of names telling what data is in use
    let originalData = {}; // Set of the original data?

    // Indicates if we need to update/save the config to the server
    let needSave = false;
    let updatedVar = true;

    // All plotting data
    let plotData = null;

    // ******************* Initialization ******************* //

    /**
     * Constructor
     */
    function init() {
        // Set the original plotly width/height
        if (container.width != null) {
            plotlyElement.style.width = container.width.toString() + 'px';
            plotlyElement.style.height =
                (container.height - deltaPlotHeight).toString() + 'px';
        }

        // On click open options in navigation
        options.onclick = function() {
            openInNav();
        };

        // Set up the basic plot
        if (plotlyElement !== null) {
            Plotly.plot(
                plotlyElement,
                [
                    {
                        x: [1, 2, 3, 4, 5],
                        y: [0, 0, 0, 0, 0]
                    }
                ],
                { margin: { t: 0 } }
            );
        }

        // Get metadata and vars
        server.getMetadata(function(a2p, p2a) {
            server.getVars((d, o, c, s, i) => {
                plotVarsInitial(d, o, c, s, i, a2p, p2a);
            });
        });

        // Start trying to update the variables so data is live
        setInterval(tryUpdateVariables, checkUpdateVarsIntervalTime);

        // Start trying to save
        setInterval(function() {
            if (needSave) {
                needSave = false;
                layout.saveLayout(null);
            }
        }, saveIntervalTime);

        // Set callback on resize
        container.on('resize', resize);

        // Add to layout's configCallbacks so we update our componentState
        // on the server.
        layout.addPlotCallback(function() {
            if (plotData !== null) {
                componentState.variableIndices = plotData.variableIndices;
                componentState.selectedConstraints =
                    plotData.constraints.selected;
                componentState.selectedDesignVariables =
                    plotData.desvars.selected;
                componentState.selectedSysincludes =
                    plotData.sysincludes.selected;
                componentState.selectedObjectives =
                    plotData.objectives.selected;
            }
            return componentState;
        });
    }

    /**
     * Plot any and all selected variables or plot a random variable
     * if none were selected.
     *
     * @param {*} desvars
     * @param {*} objs
     * @param {*} consts
     * @param {*} sysinc
     * @param {*} inp
     * @param {*} abs2prom
     * @param {*} prom2abs
     */
    function plotVarsInitial(
        desvars,
        objs,
        consts,
        sysinc,
        inp,
        abs2prom,
        prom2abs
    ) {
        plotData = new PlotData(
            desvars,
            objs,
            consts,
            sysinc,
            componentState.selectedDesignVariables,
            componentState.selectedObjectives,
            componentState.selectedConstraints,
            componentState.selectedSysincludes,
            abs2prom,
            prom2abs,
            componentState.variableIndices
        );

        // If we already have selected variables, plot those
        if (plotData.hasSelectedVars) {
            plotData.getSelectData(setData);
        } else {
            // Otherwise, plot a random design variable
            let randIndex = Math.floor(
                Math.random() * plotData.desvars.data.length
            );
            if (randIndex < plotData.desvars.data.length) {
                plotData.desvars.selectVarAndGetData(
                    setData,
                    plotData.desvars.data[randIndex]
                );
            }
        }
    }

    // ******************* Private Helper Methods ******************* //

    /**
     * Function which is called when the window is resized.
     * Resets the dimensions for plotly
     */
    function resize() {
        // Set plotlyElement's dimensions
        plotlyElement.style.width = container.width.toString() + 'px';
        plotlyElement.style.height =
            (container.height - deltaPlotHeight).toString() + 'px';

        // Set up plotly's dimensions
        Plotly.relayout(plotlyElement, {
            width: container.width,
            height: container.height - deltaPlotHeight
        });
    }

    /**
     * Function which sets plot's data. Searches through to determine
     * which values to show (based on selected indices), then updates plotly
     *
     * @param {[Object]} dat
     */
    function setData(dat, variable) {
        curData = [];
        originalData[variable] = dat;

        // Place everything in the data array
        for (let i = 0; i < dat.length; ++i) {
            let element = dat[i];
            let indexOfIterType = getIndexOfIterType(element['iteration']);
            if (indexOfIterType == -1) {
                curData.push([element]);
            } else {
                curData[indexOfIterType].push(element);
            }
        }

        // Determine which data set to plot by default
        let largestCount = -1;
        let index = -1;
        for (let i = 0; i < curData.length; ++i) {
            if (curData[i].length > largestCount) {
                largestCount = curData.length;
                index = i;
            }
        }

        let finalData = setNewPlotData(index, variable);
        updateArraysInControlPanel(finalData, variable);
        dataInUse[variable] = finalData;
        updatePlotly(dataInUse);
    }

    /**
     * Sorts and formats data at the given index of curData, then
     * plots it
     *
     * @param {Number} index
     */
    function setNewPlotData(index, variableName) {
        // Sort the data to be plotted
        curData[index].sort(compareIterations);

        let allSets = plotData.allSets;
        let finalData = [];

        // Set up data for plotting
        for (let i = 0; i < allSets.length; ++i) {
            let set = allSets[i];
            let temp = formatData(
                index,
                function(obj) {
                    return obj['type'] == set.name;
                },
                variableName + ' '
            );
            Array.prototype.push.apply(finalData, temp);
        }

        // Set the precision of the data
        for (let j = 0; j < finalData.length; ++j) {
            for (let i = 0; i < finalData[j].y.length; ++i) {
                let val = finalData[j].y[i];
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
     * @param{[Object]} data - the data to be plotted
     */
    function updatePlotly(data) {
        let finalData = [];

        data = extractBasedOnIndices(data);

        let titleString = '';
        for (let k in data) {
            titleString += plotData.abs2prom.output[k] + ' ';
            for (let n = 0; n < data[k].length; ++n) {
                finalData.push(data[k][n]);
                finalData[finalData.length - 1]['type'] = 'scatter';
            }
        }

        titleString += ' vs. Iterations';

        // Set up the layout
        let xaxis = {
            title: 'Iteration'
        };

        let yaxis = {
            title: 'Value'
        };

        if (componentState.stackedPlotVal) {
            yaxis.title = '';
        }

        if (componentState.logscaleXVal) {
            xaxis['type'] = 'log';
        }
        if (componentState.logscaleYVal) {
            yaxis['type'] = 'log';
        }

        let layout = {
            title: titleString,
            xaxis: xaxis,
            yaxis: yaxis
        };

        // Deal with stacked plots
        if (componentState.stackedPlotVal) {
            updateForStackedPlots(finalData, layout);
        } else {
            // Delete the old y-axis values if you used stacked plots previously
            for (let i = 0; i < finalData.length; ++i) {
                delete finalData[i].yaxis;
            }
        }

        // Plot it
        Plotly.newPlot(plotlyElement, finalData, layout);
    }

    /**
     * Sorts through the data that's ready for plotly and removes
     * any data that shouldn't be shown based on the user's selected indices.
     *
     * @param {*} data
     * @returns {*}
     */
    function extractBasedOnIndices(data) {
        let ret = {};

        for (let d in data) {
            let ind = findVariableInIndices(d);

            if (ind != null) {
                ret[d] = [];

                // Go over each index and see if it's in
                // the index set (the set of indexes to be plotted).
                // if so, add it to our return array
                for (let i = 0; i < data[d].length; ++i) {
                    if (ind.indexSet.indexOf(i) >= 0) {
                        ret[d].push(data[d][i]);
                    }
                }
            } else {
                // Otherwise it isn't in variableIndices and isn't restricted
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
    function findVariableInIndices(name) {
        for (let i = 0; i < plotData.variableIndices.length; ++i) {
            if (plotData.variableIndices[i].name === name) {
                return plotData.variableIndices[i];
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
    function updateForStackedPlots(data, curLayout) {
        // Set the y axis for each of data set and get the total number of unique variables
        let prevYIndex = 1;
        curLayout['shapes'] = [];

        for (let i = 1; i < data.length; ++i) {
            if (checkIfNewVariable(data[i].name, data[i - 1].name)) {
                ++prevYIndex;
            }

            //if prevYIndex == 1, then we're on the first variable, which isn't given a number
            data[i]['yaxis'] =
                'y' + (prevYIndex == 1 ? '' : prevYIndex.toString());
        }

        // Use prevYIndex as proxy for number of unique variables
        let numVars = prevYIndex;
        let delta = 1.0 / numVars;
        curLayout['yaxis']['domain'] = [0, delta];

        // Set layout
        for (let i = 2; i <= numVars; ++i) {
            curLayout['yaxis' + i.toString()] = {
                domain: [delta * (i - 1), delta * i]
            };
            curLayout['shapes'].push({
                type: 'line',
                x0: 0,
                y0: delta * (i - 1),
                x1: 1,
                y1: delta * (i - 1),
                xref: 'paper',
                yref: 'paper',
                opacity: '0.8',
                line: {
                    color: '#444444',
                    width: 2.5,
                    dash: 'dot'
                }
            });

            if (componentState.logscaleYVal) {
                curLayout['yaxis' + i.toString()]['type'] = 'log';
            }
        }
    }

    /**
     * Checks if a given variable name is a new variable
     * or simply another index of a variable that is already being used in 'data'
     *
     * Used by updateForStackedPlots
     *
     * @param {String} name
     * @param {String} prev
     * @returns {Boolean} true if it's new, false if it's already used in 'data'
     */
    function checkIfNewVariable(name, prev) {
        // Convert name from 'name[x][y][z]' to 'name|x|y|z|'
        let alteredName = name.replace(/\[/g, '|');
        alteredName = alteredName.replace(/]/g, '|');
        alteredName = alteredName.replace(/\|\|/g, '|');

        let alteredPrev = prev.replace(/\[/g, '|');
        alteredPrev = alteredPrev.replace(/]/g, '|');
        alteredPrev = alteredPrev.replace(/\|\|/g, '|');

        // Split so we get ['name', 'x', 'y', 'z']
        let splitName = alteredName.split('|');
        let splitPrev = alteredPrev.split('|');

        // Check the names. If they're different, then we have a new variable
        if (splitName[0] !== splitPrev[0]) {
            return true;
        }

        return false;
    }

    /**
     * Pulls out the data at the given index from curData and returns
     * it in a format that's friendly for Plotly
     *
     * NOTE: In the current state, it is needlessly complex dealing with variable
     *  arrays and arrays of arrays. Should find a generic way to do this that's
     *  a bit cleaner.
     *
     * @param {Number} index
     * @return {Object}
     */
    function formatData(index, typeFunc, prependName = '') {
        let finalData = [];
        let gotFirstProp = false;
        for (let i = 0; i < curData[index].length; ++i) {
            for (let j = 0; j < curData[index][i]['values'].length; ++j) {
                if (
                    curData[index][i]['values'][0].hasOwnProperty('length') &&
                    curData[index][i]['values'][0][0].length
                ) {
                    for (
                        let k = 0;
                        k < curData[index][i]['values'][0].length;
                        ++k
                    ) {
                        for (
                            let l = 0;
                            l < curData[index][i]['values'][0][0].length;
                            ++l
                        ) {
                            if (!gotFirstProp && typeFunc(curData[index][i])) {
                                finalData.push({
                                    x: [curData[index][i]['counter']],
                                    y: [curData[index][i]['values'][j][k][l]],
                                    name:
                                        prependName +
                                        '[' +
                                        k +
                                        ']' +
                                        '[' +
                                        l +
                                        ']'
                                });
                            } else {
                                if (typeFunc(curData[index][i])) {
                                    let l_len =
                                        curData[index][i]['values'][0][0]
                                            .length;
                                    finalData[k + l_len * l].x.push(
                                        curData[index][i]['counter']
                                    );
                                    finalData[k + l_len * l].y.push(
                                        curData[index][i]['values'][j][k][l]
                                    );
                                    finalData[k + l_len * l].name =
                                        prependName + '[' + k + '][' + l + ']';
                                }
                            }
                        }
                    }
                    gotFirstProp = true;
                } else if (
                    curData[index][i]['values'][0].hasOwnProperty('length')
                ) {
                    for (
                        let k = 0;
                        k < curData[index][i]['values'][0].length;
                        ++k
                    ) {
                        if (
                            (typeFunc(curData[index][i]) && !gotFirstProp) ||
                            (typeFunc(curData[index][i]) &&
                                j >= finalData.length)
                        ) {
                            finalData.push({
                                x: [curData[index][i]['counter']],
                                y: [curData[index][i]['values'][j][k]],
                                name: prependName + '[' + k + ']'
                            });
                        } else {
                            if (typeFunc(curData[index][i])) {
                                finalData[k].x.push(
                                    curData[index][i]['counter']
                                );
                                finalData[k].y.push(
                                    curData[index][i]['values'][j][k]
                                );
                                finalData[k].name = prependName + '[' + k + ']';
                            }
                        }
                    }
                    gotFirstProp = true;
                } else {
                    if (
                        (typeFunc(curData[index][i]) && !gotFirstProp) ||
                        (typeFunc(curData[index][i]) && j >= finalData.length)
                    ) {
                        gotFirstProp = true;
                        finalData.push({
                            x: [curData[index][i]['counter']],
                            y: [curData[index][i]['values'][j]],
                            name: prependName + '[' + j + ']'
                        });
                    } else {
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
     * Compares two iterations by their counter. Returns
     *  1 if a > b, -1 if a < b, and 0 if they're equal.
     *
     * @param {String} a
     * @param {String} b
     * @return {Number}
     */
    function compareIterations(a, b) {
        if (a['counter'] > b['counter']) {
            return 1;
        } else if (b['counter'] > a['counter']) {
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
     * @return {Number}
     */
    function getIndexOfIterType(iter) {
        for (let i = 0; i < curData.length; ++i) {
            let tempIter = curData[i][0]['iteration'];
            let found = true;
            if (tempIter.length == iter.length) {
                for (let j = 0; j < tempIter.length; ++j) {
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
    }

    /**
     * Attempts to get the data with the given name and
     * plot it.
     *
     * @param {string} name
     * @param {string} type
     */
    function handleSearch(name, type) {
        needSave = true;
        plotData.getSetByName(type).selectVarAndGetData(setData, name);
    }

    /**
     * Checks if a variable is an array type and, if so, updates the
     * control panel to give an indices input
     *
     * @param {*} data
     * @param {String} name
     */
    function updateArraysInControlPanel(data, name) {
        // If data's length is > 1 then we're dealing with an array variable
        if (data.length > 1) {
            let newIndices = {
                name: name,
                indices: '0-' + (data.length - 1).toString()
            };

            let duplicate = false;
            for (let i = 0; i < plotData.variableIndices.length; ++i) {
                if (plotData.variableIndices[i].name === name) {
                    duplicate = true;
                    break;
                }
            }

            if (!duplicate) {
                addIndicesToObject(newIndices);
                plotData.variableIndices.push(newIndices);
                controlPanel.addVariableIndicesGroup(
                    newIndices.name,
                    newIndices.indices
                );
            }
        }
    }

    /**
     * Tries to remove a variable from its indices grouping and
     * removes it from the control panel
     *
     * @param {String} name
     */
    function tryRemoveVariableFromIndices(name) {
        for (let i = 0; i < plotData.variableIndices.length; ++i) {
            if (plotData.variableIndices[i].name === name) {
                controlPanel.removeVariableIndicesGroup(name);
                plotData.variableIndices.splice(i, 1);
            }
        }
    }

    /**
     * Adds the 'indexSet' parameter to the given
     * varIndices object
     *
     * @param {*} varIndices
     */
    function addIndicesToObject(varIndices) {
        varIndices['indexSet'] = [];
        let splitIndices = varIndices.indices.replace(/ /g, ''); //remove spaces
        splitIndices = splitIndices.split(',');

        for (let i = 0; i < splitIndices.length; ++i) {
            let cur = splitIndices[i];
            if (!isNaN(cur)) {
                //If we're just dealing with a number
                varIndices.indexSet.push(Number(cur));
            } else {
                //If we're dealing with something of the form '0-9'
                let splitCur = cur.split('-');
                let start = Number(splitCur[0]); //first number
                let end = Number(splitCur[1]); //last number

                for (let j = start; j <= end; ++j) {
                    varIndices.indexSet.push(j);
                }
            }
        }
    }

    /**
     * Tries to update each variable in the plot by setting the 'cur_max_count' header
     */
    function tryUpdateVariables() {
        // Try to update the variables
        for (let variable in originalData) {
            let maxCount = 0;

            // Find max count in data
            for (let i = 0; i < originalData[variable].length; ++i) {
                let curCount = originalData[variable][i]['counter'];
                if (curCount > maxCount) {
                    maxCount = curCount;
                }
            }

            // If we need to udpate a var, update a var
            if (updatedVar) {
                updatedVar = false;

                server.getVariable_DriverIteration(
                    variable,
                    function(result) {
                        if (result.length > 0) {
                            //if data needs to be updated, update
                            setData(result, variable);
                        }
                    },
                    null,
                    maxCount
                );
            }
        }
    }

    /**
     * Opens the plot control options in the control panel
     */
    function openInNav() {
        // openNav can be found in control_panel.js
        controlPanel.openNav(
            componentState.logscaleXVal,
            componentState.logscaleYVal,
            componentState.stackedPlotVal,
            plotData.desvars.data,
            plotData.objectives.data,
            plotData.constraints.data,
            plotData.sysincludes.data,
            plotData.desvars.selected,
            plotData.objectives.selected,
            plotData.constraints.selected,
            plotData.sysincludes.selected,
            plotData.variableIndices,
            logscaleX,
            logscaleY,
            stackedPlot,
            variableFun,
            variableIndicesFun,
            plotData.abs2prom,
            plotData.prom2abs
        );
    }

    // ******************* Callback Methods ******************* //

    /**
     * Callback function when logscale x is selected
     *
     * @param {Boolean} val
     */
    function logscaleX(val) {
        componentState.logscaleXVal = val;
        needSave = true;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function when logscale y is selected
     *
     * @param {Boolean} val
     */
    function logscaleY(val) {
        componentState.logscaleYVal = val;
        needSave = true;
        updatePlotly(dataInUse);
    }

    /**
     * Callback function to use stacked plots
     *
     * @param {Boolean} val
     */
    function stackedPlot(val) {
        console.log('Changing stackedPlot to: ' + val);
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
    function variableFun(variable, val, type) {
        needSave = true;
        console.log('variableFun called');
        if (val) {
            handleSearch(variable, type);
        } else {
            tryRemoveVariableFromIndices(variable);
            delete dataInUse[variable];
            plotData.getSetByName(type).unselectVar(variable);
            updatePlotly(dataInUse);
        }
    }

    /**
     * Changes the indices which are shown for the given variable
     *
     * @param {String} name
     * @param {String} val
     */
    function variableIndicesFun(name, val) {
        needSave = true;
        let ind = null;
        for (let i = 0; i < plotData.variableIndices.length; ++i) {
            if (plotData.variableIndices[i].name === name) {
                ind = plotData.variableIndices[i];
                break;
            }
        }

        if (ind !== null) {
            ind.indices = val;
            addIndicesToObject(ind);
            updatePlotly(dataInUse);
        }
        console.log('Variable Indices Function called');
    }

    init();
}
