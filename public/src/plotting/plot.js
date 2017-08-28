var createPlot = function (container) {
    var curData = [];
    var element = container.getElement()[0].lastChild;
    var searchElement = container.getElement()[0].firstChild;
    searchElement.style.width = (container.width - 20).toString() + 'px';
    searchElement.style.height = '15px';
    searchElement.style.marginTop = '20px';
    element.style.width = container.width.toString() + 'px';
    element.style.height = (container.height - 20).toString() + 'px'

    var search;
    //Set up the basic plot
    if (element != null) {
        Plotly.plot(element, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16]
        }],
            { margin: { t: 0 } }
        );
    }

    /**
     * Function which is called when the window is resized.
     * Resets the dimensions for plotly
     */
    var resize = function () {
        //Set element's dimensions
        element.style.width = container.width.toString() + 'px';
        element.style.height = (container.height.toString()-20) + 'px';
        searchElement.style.width = (container.width - 20).toString() + 'px';
        
        //Set up plotly's dimensions
        Plotly.relayout(element, {
            width: container.width,
            height: container.height - 20
        });
    };

    /**
     * Function which sets plot's data. Searches through to determine
     * which values to show, then updates plotly
     * 
     * @param {[Object]} dat 
     */
    var setData = function(dat) {
        curData = [];

        //Place everything in the data array
        for(var i = 0; i < dat.length; ++i) {
            var indexOfIterType = getIndexOfIterType(dat[i]['iteration']);
            if(indexOfIterType == -1) {
                curData.push([dat[i]]);
            }
            else {
                curData[indexOfIterType].push(dat[i]);
            }
        }

        //Determine which data set to plot by default
        var largestCount = -1;
        var index = -1;
        for(var i = 0; i < curData.length; ++i) {
            if(curData[i].length > largestCount) {
                largestCount = curData.length;
                index = i;
            }
        }

        //Sort the data to be plotted
        curData[index].sort(compareIterations);

        //Set up data for plotting
        var finalData = [];
        for(var i = 0; i < curData[index].length; ++i) {
            for(var j = 0; j < curData[index][i]['values'].length; ++j) {
                if(i == 0) {
                    finalData.push({
                        x: [0],
                        y: [curData[index][i]['values'][j]]
                    })
                }
                else {
                    finalData[j].x.push(i);
                    finalData[j].y.push(curData[index][i]['values'][j])
                }
            }
        }

        //plot it
        Plotly.newPlot(element, finalData);
    };

    /**
     * Compares two iterations by their counter. Returns
     *  1 if a > b, -1 if a < b, and 0 if they're equal.
     * 
     * @param {Iteration} a 
     * @param {Iteration} b 
     */
    var compareIterations = function(a, b) {
        if(a['counter'] > b['counter']) {
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
     */
    var getIndexOfIterType = function(iter) {
        for(var i = 0; i < curData.length; ++i) {
            var tempIter = curData[i][0]['iteration'];
            var found = true;
            if(tempIter.length == iter.length) {
                for(var j = 0; j < tempIter.length; ++j) {
                    if(tempIter[j]['name'] != iter[j]['name']) {
                        found = false;
                        break;
                    }
                }

                if(found) {
                    return i;
                }
            }
        }

        return -1;
    };

    //Get the variables
    http.get('case/' + case_id + '/variables', function(result) {
        result = JSON.parse(result);
        search = new Awesomplete(searchElement, {list: result})
    });

    //Bind to search so that we grab data and update plot after searching
    Awesomplete.$.bind(searchElement, { "awesomplete-select":function(event)
    {
        http.get('case/' + case_id + '/system_iterations/' + event.text.value, function(result) {
            result = JSON.parse(result);
            console.log(result);
            setData(result);
        });
    }});

    //Set callback on resize
    container.on('resize', resize);
};