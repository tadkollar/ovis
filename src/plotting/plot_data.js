'use strict';

/**
 * Class PlotData - Stores the data used for plots
 */
class PlotData {
    /**
     * Constructor method
     *
     * @param {[String]} desvars
     * @param {[String]} objectives
     * @param {[String]} constraints
     * @param {[String]} sysincludes
     * @param {[String]} desvarsSelected
     * @param {[String]} objectivesSelected
     * @param {[String]} constraintsSelected
     * @param {[String]} sysincludesSelected
     * @param {*} prom2abs
     * @param {*} abs2prom
     * @param {[*]} variableIndices
     */
    constructor(
        desvars,
        objectives,
        constraints,
        sysincludes,
        desvarsSelected,
        objectivesSelected,
        constraintsSelected,
        sysincludesSelected,
        prom2abs,
        abs2prom,
        variableIndices
    ) {
        // Store data in PlotVariables
        this.desvars = new PlotVariables(desvars, 'desvar', desvarsSelected);
        this.objectives = new PlotVariables(
            objectives,
            'objective',
            objectivesSelected
        );
        this.constraints = new PlotVariables(
            constraints,
            'constraint',
            constraintsSelected
        );
        this.sysincludes = new PlotVariables(
            sysincludes,
            'sysinclude',
            sysincludesSelected
        );
        this.prom2abs = prom2abs;
        this.abs2prom = abs2prom;
        this.variableIndices = variableIndices;

        // Add name to prom2abs and abs2prom if it isn't there already
        this.allVars.forEach(name => {
            if (!(name in this.prom2abs['output'])) {
                this.prom2abs['output'][name] = name;
            }
            if (!(name in this.abs2prom['output'])) {
                this.abs2prom['output'][name] = name;
            }
        });
    }

    // ******************* Property Getters ******************* //

    /**
     * The set of all variables across all datasets
     */
    get allVars() {
        let ret = [];
        let sets = this.allSets;
        for (let i = 0; i < sets.length; ++i) {
            Array.prototype.push.apply(ret, sets[i].data);
        }
        return ret;
    }

    /**
     * Array of all datasets
     */
    get allSets() {
        return [
            this.desvars,
            this.objectives,
            this.constraints,
            this.sysincludes
        ];
    }

    /**
     * True if any dataset has selected data
     */
    get hasSelectedVars() {
        return (
            this.desvars.selected.length > 0 ||
            this.objectives.selected.length > 0 ||
            this.constraints.selected.length > 0 ||
            this.sysincludes.selected.length > 0
        );
    }

    // ******************* Public Methods ******************* //

    /**
     * Get all driver iteration data stored for all selected variables
     *
     * @param {function} callback - callback of the form function(data, name)
     */
    getSelectData(callback) {
        this.allSets.forEach(set => {
            set.getAllSelectedData(callback);
        });
    }

    /**
     * Get a set by its associated name
     *
     * @param {String} name
     */
    getSetByName(name) {
        let sets = this.allSets;
        for (let i = 0; i < sets.length; ++i) {
            let set = sets[i];
            if (set.name === name) {
                return set;
            }
        }

        return null;
    }
}

/**
 * Class PlotVariables - Represents one dataset (desvar, constraint, etc.)
 *
 * @param {[String]} data - the set of variable names
 * @param {String} name - name of dataset
 * @param {[String]} selected - the set of selected variable names
 */
function PlotVariables(data, name, selected) {
    // ******************* Public Variables ******************* //
    this.data = data;
    this.name = name;
    this.selected = selected;

    // Kept separate because 'this' doesn't follow standard scope
    // rules in JS, but regular variables do
    let self = this;

    // ******************* Public Methods ******************* //

    /**
     * Get all driver iteration data stored for all selected variables
     *
     * @param {function} callback - callback of the form function(data, name)
     */
    this.getAllSelectedData = function(callback) {
        self.selected.forEach(v => {
            self.selectVarAndGetData(callback, v);
        });
    };

    /**
     * Add a given variable to the selected set and get driver iteration
     * data for that variable
     *
     * @param {function} callback - callback of the form function(data, name)
     * @param {String} name - name of variable to get data for
     */
    this.selectVarAndGetData = function(callback, name) {
        if (self.selected.indexOf(name) < 0) {
            self.selected.push(name);
        }
        server.getVariable_DriverIteration(name).then(result => {
            callback(result, name);
        });
    };

    /**
     * Take a variable out of the 'selected' set
     *
     * @param {*} name
     */
    this.unselectVar = function(name) {
        let index = self.selected.indexOf(name);
        if (index >= 0) {
            self.selected.splice(index, 1);
        }
    };
}
