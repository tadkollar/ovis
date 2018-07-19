'use strict';

var { ipcRenderer } = require('electron');

/**
 * Class Server - series of functions to interface with the data server
 */
function Server() {
    /**
     * Get abs2prom and prom2abs metadata from the server
     *
     * @returns {Promise} resolves to {'abs2prom':..., 'prom2abs':...}
     */
    this.getMetadata = async function() {
        return new Promise(function(resolve, reject) {
            ipc.getMetadata(data => {
                resolve(data);
            });
        });
        // http.server_get(
        //     'metadata',
        //     function(result) {
        //         if (result !== '[]' && result !== 'null') {
        //             result = JSON.parse(result);
        //             callback(result.abs2prom, result.prom2abs);
        //         } else {
        //             callback(null, null);
        //         }
        //     },
        //     error
        // );
    };

    /**
     * Get the set names of variables for which we have data
     */
    this.getVars = async function() {
        return new Promise(function(resolve, reject) {
            ipc.getAllDriverVars(data => {
                let designVariables = [];
                let objectives = [];
                let constraints = [];
                let sysincludes = [];
                let inputs = [];
                data.forEach(element => {
                    let name = element['name'];
                    let type = element['type'];
                    if (type === 'desvar') {
                        designVariables.push(name);
                    } else if (type === 'objective') {
                        objectives.push(name);
                    } else if (type === 'constraint') {
                        constraints.push(name);
                    } else if (type === 'sysinclude') {
                        sysincludes.push(name);
                    } else {
                        inputs.push(name);
                    }
                });

                let ret = {
                    desvars: designVariables,
                    objectives: objectives,
                    constraints: constraints,
                    sysincludes: sysincludes,
                    inputs: inputs
                };

                resolve(ret);
            });
        });
        // http.server_get(
        //     'allvars',
        //     function(result) {
        //         result = JSON.parse(result);
        //         let designVariables = [];
        //         let objectives = [];
        //         let constraints = [];
        //         let sysincludes = [];
        //         let inputs = [];
        //         // Separate into types
        //         result.forEach(element => {
        //             let name = element['name'];
        //             let type = element['type'];
        //             if (type === 'desvar') {
        //                 designVariables.push(name);
        //             } else if (type === 'objective') {
        //                 objectives.push(name);
        //             } else if (type === 'sysinclude') {
        //                 sysincludes.push(name);
        //             } else if (type === 'input') {
        //                 inputs.push(name);
        //             } else {
        //                 constraints.push(name);
        //             }
        //         });
        //         callback(
        //             designVariables,
        //             objectives,
        //             constraints,
        //             sysincludes,
        //             inputs
        //         );
        //     },
        //     error
        // );
    };

    /**
     * Get the data for a given variable. If maxCount is given then data
     * will only be returned for iterations > maxCount
     *
     * @param {String} name - the variable name
     * @param {Number} maxCount - the current max iteration count, if you only want newest data
     */
    this.getVariable_DriverIteration = async function(name, maxCount = -1) {
        return new Promise(function(resolve, reject) {
            if (maxCount >= 0) {
                ipc.getDriverIterationCount(name, maxCount, data => {
                    resolve(data);
                });
            } else {
                ipc.getDriverIterationData(name, data => {
                    resolve(data);
                });
            }
        });
        // If we have a maxCount, set the header
        // let headers = [];
        // if (maxCount > 0) {
        //     headers = [
        //         {
        //             name: 'cur_max_count',
        //             value: maxCount
        //         }
        //     ];
        // }

        // http.server_get(
        //     'driver_iterations/' + name,
        //     function(result) {
        //         callback(JSON.parse(result));
        //     },
        //     error,
        //     headers
        // );
    };

    /**
     * Get the layout from the server
     *
     */
    this.getLayout = function() {
        return new Promise(function(resolve, reject) {
            ipc.getLayout(data => {
                resolve(data);
            });
        });
        // http.server_get(
        //     'layout',
        //     function(ret) {
        //         callback(JSON.parse(ret));
        //     },
        //     error
        // );
    };

    /**
     * Get the driver metadata from the server
     *
     */
    this.getDriverMetadata = function() {
        return new Promise(function(resolve, reject) {
            ipc.getModelViewerData(data => {
                resolve(data[0]);
            });
        });
        // http.server_get(
        //     'driver_metadata',
        //     function(response) {
        //         var data = JSON.parse(response)[0];
        //         callback(data);
        //     },
        //     error
        // );
    };

    /**
     * Save the given layout
     *
     * @param {JSON} layout - the layout to be saved
     */
    this.saveLayout = function(layout) {
        return new Promise(function(resolve, reject) {
            let state = JSON.stringify(layout);
            ipc.updateLayout({ layout: state });
        });

        // let body = {
        //     layout: state
        // };
        // http.server_post('layout', body, callback, error);
    };
}

const server = new Server();
