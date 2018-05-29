'use strict';

/**
 * Class Server - series of functions to interface with the REST server
 */
function Server() {
    /**
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
}

const server = new Server();
