'use strict';

const fs = require('fs');
const path = require('path');
const is = require('electron-is');

const { webFrame } = require('electron')

var plotList = [];

/**
 * Class Layout - Handles loading/saving/updating the layout
 *
 * Uses GoldenLayout (https://golden-layout.com/)
 */
class Layout {
    constructor() {

        // The list of callbacks to get configs from plots
        // so that we can update their componentState on the server.
        // NOTE: It's the responsibility of the plot to add its callback via addPlotCallback.
        // Passing by reference does not work when passing around componentState, unfortunately
        this.configCallbacks = [];
        this.lastLayout = null;
        this.myLayout = null;

        // Grab the ptn2 and plot HTML data
        this.ptn2_loc = path.join(process.resourcesPath, 'components/n2.html');
        this.plot_loc = path.join(process.resourcesPath, 'components/plot.html');

        if (is.dev()) {
            this.ptn2_loc = path.join(__dirname, 'components/n2.html');
            this.plot_loc = path.join(__dirname, 'components/plot.html');
        }
        this.ptn2_file = fs.readFileSync(this.ptn2_loc);
        // this.ptn2_file = "<html><head><style>iframe { height: 100%; width: 100%; }</style></head><body><iframe src='n2embed.html'></iframe></html>";
        this.plot_file = fs.readFileSync(this.plot_loc);

        //Initial configuration. 2 plots next to an N^2
        let config = {
            content: [
                {
                    type: 'row',
                    content: [
                        this._getN2Config(),
                        {
                            type: 'column',
                            content: [this._getPlotConfig(), this._getPlotConfig()]
                        }
                    ]
                }
            ]
        };

        // Create the initial golden layout dashboard
        server.getLayout().then(ret => {
            if (ret.length === 0) {
                this.myLayout = this._createLayout(config);
            }
            else {
                this.myLayout = this._createLayout(JSON.parse(ret[0]['layout']));
            }
        });

        ipc.getFilename(function (filename) {
            if (filename.length > 14) {
                filename = filename.substring(0, 14) + '...';
            }

            document.getElementById('sidebarHeaderContent').innerHTML = filename;
            console.log(filename);
        });

        // zoom with mousewheel
        $('#goldenLayout').bind('mousewheel', function (e) {
            event.preventDefault();
            if (e.ctrlKey) {
                let wheelDelta = e.originalEvent.wheelDelta;
                if (wheelDelta > 0) {
                    webFrame.setZoomLevel(webFrame.getZoomLevel() + 1);
                }
                else if (wheelDelta < 0) {
                    webFrame.setZoomLevel(webFrame.getZoomLevel() - 1);
                }
            }
        });
    }

    /**
     * Add the current plot to the config callback which requests
     * the plot's component state.
     * @param {function} callback - function that returns plot component state
     */
    addPlotCallback(callback) {
        this.configCallbacks.push(callback);
    }

    /**
     * Saves the current layout to the server
     * @param {Object} lt
     */
    saveLayout(lt) {
        // If we're in tests, don't save the new layout
        if (process.env.RUNNING_IN_VIS_INDEX_TESTS) {
            return;
        }

        if (lt == null) {
            //when plots are trying to save, layout will be null
            lt = this.lastLayout;
            if (this.lastLayout == null) return;
        }

        this.lastLayout = lt;
        let state = lt.toConfig();
        let componentStates = this._getComponentStates();
        this._replaceComponentStates(state, componentStates);
        server.saveLayout(state);
    }

    /**
     * Adds another plot to the current dashboard or creates a new
     * dashboard if one does not exist.
     */
    addNewPlot() {
        if (this.myLayout.root !== null && this.myLayout.root.contentItems.length > 0) {
            this.myLayout.root.contentItems[0].addChild(this._getPlotConfig());
        }
        else {
            //Everything was deleted in the dashboard
            //Remove the previous layout
            let n = document.getElementById('goldenLayout');
            while (n.firstChild) {
                n.removeChild(n.firstChild);
            }

            //Configure new layout
            let newConfig = {
                content: [
                    {
                        type: 'row',
                        content: [this._getPlotConfig()]
                    }
                ]
            };
            this.myLayout = this._createLayout(newConfig);
        }
    }

    /**
     * Adds an N2 diagram to the current dashboard or creaes a new
     * dashboard if one does not exist.
     */
    addNewN2() {
        if (this.myLayout.root !== null && this.myLayout.root.contentItems.length > 0) {
            this.myLayout.root.contentItems[0].addChild(this._getN2Config());
        }
        else {
            //Remove the previous layout
            let n = document.getElementById('goldenLayout');
            while (n.firstChild) {
                n.removeChild(n.firstChild);
            }

            //Configure the new layout
            let newConfig = {
                content: [
                    {
                        type: 'row',
                        content: [this._getN2Config()]
                    }
                ]
            };
            this.myLayout = this._createLayout(newConfig);
        }
    }

    // ******************* Private Helper Methods ******************* //

    /**
     * Returns a random number between 0 and 100,000,000
     * @returns {String} random number as string
     */
    _getRand() {
        return Math.floor(Math.random() * 100000000).toString();
    }

    /** Get a plot configuration */
    _getPlotConfig() {
        //Golden Layout configuration for plots
        let plotConfig = {
            type: 'component',
            componentName: 'Variable vs. Iterations',
            componentState: {
                'label': this._getRand(),
                'localscaleXVal': false,
                'localscaleYVal': false,
                'stackedPlotVal': false,
                'selectedDesignVariables': [],
                'selectedConstraints': [],
                'selectedObjectives': [],
                'selectedSysincludes': [],
                'variableIndices': []
            }
        };
        return plotConfig;
    }

    /** Get an N2 configuration */
    _getN2Config() {
        //Golden Layout configuration for N^2
        let n2Config = {
            type: 'component',
            componentName: 'Partition Tree and N<sup>2</sup>',
            componentState: { 'label': this._getRand() }
        };

        return n2Config;
    }

    /**
     * Creates a new Golden Layout based on the configuration passed
     * to it and returns the GoldenLayout.
     * @param {Object} newConfig
     */
    _createLayout(newConfig) {
        let lt = new GoldenLayout(newConfig);
        this._registerN2(lt);
        this._registerPlot(lt);
        lt.container = '#goldenLayout';
        lt._isFullPage = true;
        lt.init();
        lt.on('stateChanged', function () {
            layout.saveLayout(lt);
        });
        return lt;
    }

    /**
     * Registers the N2 Golden Layout configuration so that N^2 diagrams may be added
     * @param {Object} lt
     */
    _registerN2(lt) {
        let self = this;

        lt.registerComponent('Partition Tree and N<sup>2</sup>', function (container) {
            container.getElement().html(self.ptn2_file.toString());

            initializeOvisN2();

            // Disable the Add N2 button because you can't have multiple N2
            document.getElementById('addN2Button').disabled = true;

            // If we close the container, re-enable the Add N2 button
            container.on('destroy', function () {
                document.getElementById('addN2Button').disabled = false;
            });
        });
    }

    /**
     * Registers the Plot Golden Layout configurations othat plots may be added
     * @param {Object} lt
     */
    _registerPlot(lt) {
        let self = this;
        lt.registerComponent('Variable vs. Iterations', function (container, componentState) {
            // Add the plot component to the container
            container.getElement().html(self.plot_file.toString());

            // Global function found in plot.js
            plotList.push(new Plot(container, componentState));
        });
    }

    /**
     * Goes through, finds, and replaces all component states that are
     * in the component states map. Used by saveLayout
     *
     * NOTE: recursive method (could be replaced with a stack)
     *
     * @param {Object} state
     * @param {Object} componentStatesMap
     */
    _replaceComponentStates(state, componentStatesMap) {
        if (state.hasOwnProperty('componentState')) {
            let label = state.componentState.label;
            if (Number(label) in componentStatesMap) {
                state.componentState = componentStatesMap[label];
            }
        }

        if (state.hasOwnProperty('content')) {
            for (let i = 0; i < state.content.length; ++i) {
                this._replaceComponentStates(state.content[i], componentStatesMap);
            }
        }
    }

    /**
     * Grabs all componentStates from the configCallbacks array.
     * Returns a map from label to componentState
     */
    _getComponentStates() {
        let ret = {};
        for (let i = 0; i < this.configCallbacks.length; ++i) {
            let config = this.configCallbacks[i]();
            ret[config['label']] = config;
        }

        return ret;
    }
}

/**
 * Wait until the server is noted to be connected, then create Layout.
 * This is required because Layout immediately makes requests of the
 * server, then produces the plot(s) and N^2 which also make requests.
 * By waiting we avoid having to make a queue in server.js of actions
 * to be taken once connection is complete
 */
function startWhenConnected() {
    setTimeout(() => {
        if (server.connected) { layout = new Layout(); }
        else { startWhenConnected(); }
    }, 50);
}

let layout = null;
startWhenConnected();
