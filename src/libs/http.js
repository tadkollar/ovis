'use strict';

/**
 * Class HTTP - allows user to contact the server for any HTTP requests
 *
 * Note: I'm using ajax here because we were originally using vanilla JS rather
 * than node.js. This can likely be switched over to a node library if that's more
 * convenient.
 */
function HTTP() {
    this.baseURL = 'http://127.0.0.1:18403/';

    // ******************* Server-specific Methods ******************* //

    /**
     * Perform HTTP GET request at given address (after prepending
     *  base URL) and calls the success or error callback
     *
     * @param path - the URL excluding the base URL (which is automatically prepended)
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for error
     */
    this.server_get = function(path, success, error, headers = []) {
        this.get(this.baseURL + path, success, error, headers);
    };

    /**
     * Performs HTTP POST request at given address (after prepending
     *  base URL) and calls the success or error callback
     *
     * @param path - the URL excluding the base URL (which is automatically prepended)
     * @param data - the Data to include in the POST request
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for
     *      error
     * @param headers - the array of headers to be included. Headers should be
     *      of the form [{'name': name, 'value': value},{...}]
     */
    this.server_post = function(path, data, success, error, headers = []) {
        this.post(this.baseURL + path, data, success, error, headers);
    };

    /**
     * Perform HTTP DELETE request at given address (after prepending
     * base URL) and cals success or error callback
     *
     * @param path - the URL excluding the base URL (which is automatically prepened)
     * @param success - the success callback
     * @param error - the failure callback.
     */
    this.server_delete = function(path, success, error) {
        this.delete(this.baseURL + path, success, error);
    };

    /**
     * Perform HTTP PATCH request at given address (after prepending base URL)
     * and calls success or error callback
     *
     * @param {String} path - the URL excluding the base URL (which is automatically prepended)
     * @param {*} data - the body of the patch
     * @param {*} success - the success callback
     * @param {*} error - the error callback
     */
    this.server_patch = function(path, data, success, error) {
        this.patch(this.baseURL + path, data, success, error);
    };

    // ******************* Generic Methods ******************* //

    /**
     * Perform HTTP GET request at given address
     * and calls the success or error callback
     *
     * @param path - the URL
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for error
     */
    this.get = function(path, success, error, headers = []) {
        $.ajax({
            url: path,
            type: 'GET',
            success: function(response) {
                success(response);
            },
            beforeSend: function(xhr) {
                for (var i = 0; i < headers.length; ++i) {
                    xhr.setRequestHeader(
                        headers[i]['name'],
                        headers[i]['value']
                    );
                }
            }
        });
    };

    /**
     * Perform HTTP POST request at given address
     * and calls the success or error callback
     *
     * @param path - the URL
     * @param data - the Data to include in the POST request
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for
     *      error
     * @param headers - the array of headers to be included. Headers should be
     *      of the form [{'name': name, 'value': value},{...}]
     */
    this.post = function(path, data, success, error, headers = []) {
        $.ajax({
            url: path,
            type: 'POST',
            data: JSON.stringify(data),
            success: function(response) {
                success(response);
            },
            beforeSend: function(xhr) {
                for (var i = 0; i < headers.length; ++i) {
                    xhr.setRequestHeader(
                        headers[i]['name'],
                        headers[i]['value']
                    );
                }
            }
        });
    };

    /**
     * Perform HTTP DELETE request at given address
     * and cals success or error callback
     *
     * @param path - the URL
     * @param success - the success callback
     * @param error - the failure callback.
     */
    this.delete = function(path, success, error) {
        $.ajax({
            url: path,
            type: 'DELETE',
            success: function(response) {
                success(response);
            }
        });
    };

    /**
     * Perform HTTP PATCH request at given address
     * and calls success or error callback
     *
     * @param {String} path - the URL
     * @param {*} data - the body of the patch
     * @param {*} success - the success callback
     * @param {*} error - the error callback
     */
    this.patch = function(path, data, success, error) {
        $.ajax({
            url: path,
            type: 'PATCH',
            data: JSON.stringify(data),
            success: function(response) {
                success(response);
            }
        });
    };
}

const http = new HTTP();
