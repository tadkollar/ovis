"use strict";

/**
 * Class HTTP - allows user to contact the server for any HTTP requests
 */
function HTTP() {
    this.baseURL = 'http://openmdao.org/visualization/'
    // this.baseURL = 'http://127.0.0.1:18403/'

    /**
     * function get - performs HTTP GET request at given address (after prepending
     *  base URL) and calls the success or error callback
     * 
     * @param path - the URL excluding the base URL (which is automatically prepended)
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for error
     */
    this.get = function(path, success, error, headers = []) {
        $.ajax({
            url: this.baseURL + path,
            type: 'GET',
            success: function(response) { success(response); },
            beforeSend: function(xhr) {
                for(var i = 0; i < headers.length; ++i) {
                    xhr.setRequestHeader(headers[i]['name'], headers[i]['value'])
                }
            }
        });
    };

    /**
     * function post - performs HTTP POST request at given address (after prepending
     *  base URL) and calls the success or error callback
     * 
     * @param path - the URL excluding the base URL (which is automatically prepended)
     * @param data - the Data to include in the POST request
     * @param success - the success callback. Should have one input, the response
     * @param error - the failure callback. Should have one input, the reason for error
     */
    this.post = function(path, data, success, error) {
        $.ajax({
            url: this.baseURL + path,
            type: 'POST',
            data: JSON.stringify(data),
            success: function(response) { success(response); }
        });
    };

    /**
     * function delete - performs HTTP DELETE request at given address (after prepending
     * base URL) and cals success or error callback
     * 
     * @param path - the URL excluding the base URL (which is automatically prepened)
     * @param token - the token to use to delete
     * @param success - the success callback
     * @param error - the failure callback.
     */
    this.delete = function(path, token, success, error) {
        $.ajax({
            url: this.baseURL + path,
            type: 'DELETE',
            success: function(response) { success(response); },
            beforeSend: function(request) {
                request.setRequestHeader('token', token);
            }
        });
    }
};

var http = new HTTP();