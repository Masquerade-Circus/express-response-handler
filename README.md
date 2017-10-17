# express-response-handler

JSend compatible response handler for Express.

This module attach default and custom responses to the express request object. The result response is implemented with a response code, stack trace and [JSend specification](https://labs.omniti.com/labs/jsend) compatible properties.

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/). Installation is done using the [`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install express-response-handler
# or
$ yarn add express-response-handler
```

## Use

```javascript
var express = require('express'),
    responseHandler = require('express-response-handler'),
    App = express(),
    customCodes = [
        ['Unauthorized', 'error', 401]
    ];

App
    .use(responseHandler(customCodes))
    .get('/', (req, res) => {
        let data = {
            errors: []
        };

        // Recommended way
        res.error.Unauthorized('permission.error.unauthorized', data);

        // Also available with the same result
        res.error('Unauthorized', 'permission.error.unauthorized', data);
        res.error(401, 'permission.error.unauthorized', data);
        res.error[401]('permission.error.unauthorized', data);
    });
```

If your application calls various responses, only the first one will be sent. So in the previous example only the Recommended way will be sent.

## Response examples

If Accept Header is set to 'application/json':
```javascript
{
  "message": "permission.error.unauthorized",
  "data": {},
  "name": "Unauthorized",
  "status": "error",
  "code": 401,
  "errors": [],
  "stack": "Error\n ...",
  "time": 187.98342 // Response time
}
```

if no Accept Header or set to other than 'application/json':
```
Unauthorized: permission.error.unauthorized
```

The stack trace will be available only when env is other than production.

## Default codes attached

```javascript
/**
 * Every item follows the form
 * [@name(string), @type(string), @code(integer)]
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
]
```

Also you can pass an array of codes to the factory function. In this way you can also overwrite the default ones.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
