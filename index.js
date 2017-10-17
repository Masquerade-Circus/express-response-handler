/**
 *  Copyright 2017 Christian César Robledo López (Masquerade Circus)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


/**
 * This returns a custom response handler
 * which adds many default responses.
 * Also you can pass any custom types to the factory
 * as an array of codes to use your own.
 * @example:
 *        var express = require('express'),
 *             responseHandler = require('express-response-handler'),
 *             App = express(),
 *             customCodes = [
 *                 ['Unauthorized', 'error', 401]
 *             ];
 *
 *        App
 *            .use(responseHandler(customCodes))
 *            .get('/', (req, res) => {
 *                let data = {
 *                    errors: []
 *                };
 *
 *                // Recommended way
 *                res.error.Unauthorized('permission.error.unauthorized', data);
 *
 *                // Also available with the same result
 *                res.error('Unauthorized', 'permission.error.unauthorized', data);
 *                res.error(401, 'permission.error.unauthorized', data);
 *                res.error[401]('permission.error.unauthorized', data);
 *            });
 */


// If process isn't production, set debug to true to show the stack trace.
let debug = process.env.NODE_ENV !== 'production';

/**
 * The main codes description
 * @example [name, type, code]
 * @type {Array}
 */
let codes = [
    ['BadRequest', 'error', 400],
    ['Unauthorized', 'error', 401],
    ['PaymentRequired', 'error', 402],
    ['Forbidden', 'error', 403],
    ['NotFound', 'error', 404],
    ['MethodNotAllowed', 'error', 405],
    ['NotAcceptable', 'error', 406],
    ['RequestTimeout', 'error', 408],
    ['Conflict', 'error', 409],
    ['UnprocessableEntity', 'error', 422],
    ['TooManyRequests', 'error', 429],
    ['ServerError', 'error', 500],
    ['NotImplemented', 'error', 501],
    ['BadGateway', 'error', 502],
    ['ServiceUnavailable', 'error', 503],
    ['OK', 'success', 200],
    ['Created', 'success', 201],
    ['Accepted', 'success', 202],
    ['NoContent', 'success', 204],
    ['ResetContent', 'success', 205],
    ['PartialContent', 'success', 206],
    ['Default', 'error', 500]
];

/**
 * Creates a new response type
 * @param {string} name               Name of the response
 * @param {string} [status='success'] Type of the response
 * @param  {Number} [code=200]         Code of the response
 * @param  {Function} callback           [description]
 * @return {Function}                    Response function
 */
let createResponseType = function (name, status = 'success', code = 200, callback = undefined) {
    var Response = function (message, data, callback, errors, stack) {

        /**
         * If the status name contains "error" or "fail"
         * create a response error type with stack and errors property
         */
        if (/(error|fail)/gi.test(status)) {
            this.stack = (new Error()).stack;
            if (data !== undefined && data.stack !== undefined) {
                this.stack = stack = data.stack;
                delete data.stack;
            }

            /**
             * If the passed data contains an errors property
             * create the errors property directly on the response function
             * and delete the data.errors property
             */
            if (data !== undefined && data.errors !== undefined) {
                this.errors = errors = data.errors;
                delete data.errors;
            }
        }

        this.message = message;
        this.data = data;
        this.status = status;
        this.code = code;
        this.name = name;

        // Set the toJSON function to return a clean object of the response
        this.toJSON = function () {
            return {
                message: message || '',
                data: data || {},
                name: name,
                status: status,
                code: code,
                errors: errors || {},
                // Return the stack only if isn't a production env.
                stack: debug ? stack : 0,
                // Return the query only if isn't a production env.
                query: debug ? this.query || 0 : 0,
                time: this.time || 0
            };
        };

        // Set the toString function to return only the name and the message
        this.toString = () => `${name}: ${message}`;

        callback && callback.call && callback.apply(this, arguments);
    };

    /**
     * If the status name contains "error" or "fail"
     * set the prototype to an errors prototype
     */
    if (/(error|fail)/gi.test(status)) {
        Response.prototype = new Error();
        Response.prototype.constructor = Response;
    }

    return Response;
};

/**
 * Object to store the response functions
 * @type {Object}
 */
let responses = {
    // error: {},
    // success: {}
};

/**
 * Response factory function
 * @param {Object} res  Response object
 * @param  {string} name Name of the response
 * @param  {type} type Type of the response
 * @return {function}      response function
 */
let responseFactory = function (res, name, type) {
    return (message, data, callback) => {
        if (!res.headersSent) {
            let response = new responses[ type ][ name ](message, data, callback);
            res.status(response.code);
            response.query = res.req.query;

            // We only need to declare the text and json format,
            // and add a default format for all other responses
            res.format({
                text: () => res.send(response.toString()),
                json: () => {
                    // Delete the stack and query properties if is a production env.
                    if (!debug) {
                        delete response.stack;
                        delete response.query;
                    }

                    if (res.responseTimeStart !== undefined) {
                        res.responseTimeEnd = process.hrtime();
                        response.time = (
                            ((res.responseTimeEnd[0] * 1000000) + res.responseTimeEnd[1]) -
                            ((res.responseTimeStart[0] * 1000000) + res.responseTimeStart[1])
                        )  / 1000000;
                    }

                    res.send(response);
                },
                'default': () => {
                    /**
                     * If response.data and response.message equals to undefined
                     * create the data as the response Json object
                     */
                    if (response.data === undefined && response.message === undefined) {
                        data = JSON.stringify(response.toJSON());

                        // Delete the stack and query properties if is a production env.
                        if (!debug) {
                            delete response.stack;
                            delete response.query;
                        }

                        if (res.responseTimeStart !== undefined) {
                            res.responseTimeEnd = process.hrtime();
                            response.time = (
                                ((res.responseTimeEnd[0] * 1000000) + res.responseTimeEnd[1]) -
                                ((res.responseTimeStart[0] * 1000000) + res.responseTimeStart[1])
                            )  / 1000000;
                        }
                    }

                    res.send(data || response.data || response.message);
                }
            });
        }
    };

};

/**
 * Response Handler Factory
 * @param  {Array}  [customCodes=[]] Array of custom codes to add to the response methods, it's your duty to not overwrite the main app methods
 * @return {function}                Response handler function
 */
let responseHandlerFactory = function (customCodes = []) {
    /**
     * If there are customCodes add them to the codes array.
     * With this the developer can also overwrite the default codes
     */
    customCodes && customCodes.pop && customCodes.map(code => codes.push(code));

    // Populate the responses object store
    codes.map(code => {
        responses[ code[ 1 ] ] === undefined && (responses[ code[ 1 ] ] = {});
        responses[ code[ 1 ] ][ code[ 0 ] ] = createResponseType(code[ 0 ], code[ 1 ], code[ 2 ]);
        responses[ code[ 1 ] ][ code[ 2 ] ] = responses[ code[ 1 ] ][ code[ 0 ] ];
    });

    // Return the middleware plugin for the use with express
    return function (req, res, next) {
        if (res.responseTimeStart === undefined) {
            res.responseTimeStart = process.hrtime();
        }

        for (let i in responses) {
            let type = i;

            res[ type ] = (name, message, data, callback) => responseFactory(res, name, type)(message, data, callback);

            for (let k in responses[ type ]) {
                res[ type ][ k ] = responseFactory(res, k, type);
            }
        }

        next();
    };
};

// Export the handlerFactory
module.exports = responseHandlerFactory;
