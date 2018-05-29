'use strict';

/**
 * Class Server - series of functions to interface with the REST server
 */
function Server() {
    /**
     * Get abs2prom and prom2abs metadata from the server
     *
     * @param {function} callback - callback of the form function(abs2prom, prom2abs)
     * @param {function} error
     */
    this.getMetadata = function(callback, error = null) {
        //Get abs2prom and prom2abs metadata
        http.server_get(
            'case/' + case_id + '/metadata',
            function(result) {
                if (result !== '[]' && result !== 'null') {
                    callback(result.abs2prom, result.prom2abs);
                } else {
                    callback(null, null);
                }
            },
            error
        );
    };

    /**
     * Get the set names of variables for which we have data
     *
     * @param {function} callback - callback of the form function(desvars, objectives, constraints, sysincludes)
     * @param {function} error
     */
    this.getVars = function(callback, error = null) {
        http.server_get(
            'case/' + case_id + '/allvars',
            function(result) {
                result = JSON.parse(result);
                let designVariables = [];
                let objectives = [];
                let constraints = [];
                let sysincludes = [];
                let inputs = [];

                result.forEach(element => {
                    let name = element['name'];
                    let type = element['type'];

                    if (type === 'desvar') {
                        designVariables.push(name);
                    } else if (type === 'objective') {
                        objectives.push(name);
                    } else if (type === 'sysinclude') {
                        sysincludes.push(name);
                    } else if (type === 'input') {
                        inputs.push(name);
                    } else {
                        constraints.push(name);
                    }
                });

                callback(
                    designVariables,
                    objectives,
                    constraints,
                    sysincludes,
                    inputs
                );
            },
            error
        );
    };

    /**
     * Get the data for a given variable. If maxCount is given then data
     * will only be returned for iterations > maxCount
     *
     * @param {String} name - the variable name
     * @param {function} callback - callback of the form function(data)
     * @param {function} error
     * @param {Number} maxCount - the current max iteration count, if you only want newest data
     */
    this.getVariable_DriverIteration = function(
        name,
        callback,
        error = null,
        maxCount = -1
    ) {
        let headers = [];
        if (maxCount > 0) {
            headers = [
                {
                    name: 'cur_max_count',
                    value: maxCount
                }
            ];
        }

        http.server_get(
            'case/' + case_id + '/driver_iterations/' + name,
            function(result) {
                callback(JSON.parse(result));
            },
            error,
            headers
        );
    };
}

const server = new Server();
