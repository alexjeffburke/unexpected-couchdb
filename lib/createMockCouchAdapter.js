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
    var original;

    app.use(bodyParser.json());

    ['del', 'head', 'get', 'post', 'put'].forEach(function(verb) {
        var expressVerb = (verb === 'del' ? 'delete' : verb);

        app[verb] = createMethodWrapper(app, expressVerb);
    });

    original = createMethodWrapper(app, 'use');
    app.use = function (middleware) {
        // add the the database checking middleware restrictng it to /:db endopints
        original('/:db', middleware);
    };

    return app;
};
