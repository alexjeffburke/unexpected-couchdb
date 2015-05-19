var express = require('express');

module.exports = function createMockCouchAdapter() {
    var app = express();
    var original;

    ['del', 'head', 'get', 'post', 'put'].forEach(function(verb) {
        var expressVerb = (verb === 'del' ? 'delete' : verb);
        original = app[expressVerb];

        app[verb] = function(route, handler) {
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
    });

    return app;
};
