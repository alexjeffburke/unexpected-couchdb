var express = require('express');

function createMethodWrapper(app, verb) {
    var original = app[verb];

    return function (route, handler) {
        var hasSentResponse = false;

        original.call(app, route, function (req, res, next) {
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
    var original;

    ['del', 'head', 'get', 'post'].forEach(function(verb) {
        var expressVerb = (verb === 'del' ? 'delete' : verb);

        app[verb] = createMethodWrapper(app, expressVerb);
    });

    // disable the put method
    app.put = function () {};

    original = app.use;
    app.use = function (middleware) {
        original.call(app, '/:db', middleware);
    };

    return app;
};
