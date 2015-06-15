var bodyParser = require('body-parser');
var express = require('express');

function createMethodWrapper(app, verb) {
    var original = app[verb];

    return function (route, handler) {
        original.call(app, route, function (req, res, next) {
            // must be places here in order that it is cleared on every request
            var hasSentResponse = false;

            handler(req, {
                setHeader: function (headerName, headerValue) {
                    res.setHeader(headerName, headerValue);
                },
                send: function(statusCode, body) {
                    if (hasSentResponse) {
                        return;
                    }

                    hasSentResponse = true;

                    res.status(statusCode).send(body);
                }
            }, function _next(err) {
                if (hasSentResponse) {
                    return;
                }

                if (err) {
                    hasSentResponse = true;
                }

                next(err);
            });
        });
    };
}

module.exports = function createMockCouchAdapter() {
    var app = express();
    var deferred;
    var original;
    var put;

    app.use(bodyParser.json());

    ['del', 'head', 'get', 'post'].forEach(function(verb) {
        var expressVerb = (verb === 'del' ? 'delete' : verb);

        app[verb] = createMethodWrapper(app, expressVerb);
    });

    put = createMethodWrapper(app, 'put');
    app.put = function (route, handler) {
        if (!deferred) {
            return put(route, handler);
        }

        deferred = handler;
    };

    original = createMethodWrapper(app, 'use');
    app.use = function (middleware) {
        original('/:db', middleware);

        // now add the put method
        put('/:db', deferred);
    };

    return app;
};
