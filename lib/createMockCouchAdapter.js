var express = require('express');

function createMethodWrapper(app, verb) {
    var original = app[verb];

    return function (route, handler) {
        original.call(app, route, function (req, res, next) {
            // must be places here in order that it is cleared on every request
            var hasSentResponse = false;

            handler(req, {
                setHeader: function () {
                    // empty
                },
                send: function(statusCode, body) {
                    if (hasSentResponse) {
                        return;
                    }

                    hasSentResponse = true;

                    res.send(statusCode, body);
                }
            }, function _next(err) {
                if (hasSentResponse) {
                    return;
                }

                hasSentResponse = true;

                next(err);
            });
        });
    };
}

module.exports = function createMockCouchAdapter() {
    var app = express();
    var deferred;
    var original;

    ['del', 'head', 'get', 'post'].forEach(function(verb) {
        var expressVerb = (verb === 'del' ? 'delete' : verb);

        app[verb] = createMethodWrapper(app, expressVerb);
    });

    // store the put method
    app.put = function (route, handler) {
        deferred = handler;
    };

    original = app.use;
    app.use = function (middleware) {
        original.call(app, '/:db', middleware);

        // now add the put method
        createMethodWrapper(app, 'put')('/:db', deferred);
    };

    return app;
};
