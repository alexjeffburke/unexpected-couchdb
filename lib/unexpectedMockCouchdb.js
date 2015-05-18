var BufferedStream = require('bufferedstream');
var expect = require('unexpected');
var http = require('http');
var mockCouch = require('mock-couch');
var url = require('url');

function generateCouchdbResponse(databases, request) {
    var responseObject = null;

    function createMockReq(requestProperties) {
        var requestStream = new BufferedStream();
        requestStream.destroy = function () {
            responseProperties.requestDestroyed = true;
        };
        setImmediate(function () {
            requestStream.emit('end');
            req.emit('end');
        });

        var req = new http.IncomingMessage(requestStream);
        req.url = request.path;
        req.method = request.method;

        return req;
    }

    function createMockRes() {
        var hasSeenResponse = false;
        var res = {
            setHeader: function () {
                if (hasSeenResponse) {
                    return;
                }
            },
            send: function (statusCode, body) {
                if (hasSeenResponse) {
                    return;
                }

                responseObject = {
                    statusCode: statusCode,
                    body: body
                };

                hasSeenResponse = true;
            }
        };

        return res;
    }

    var req = createMockReq(request);
    var res = createMockRes();

    var couchdb = mockCouch.express();

    Object.keys(databases).forEach(function (databaseName) {
        couchdb.addDB(databaseName, databases[databaseName].docs || []);
    });

    // run the handler
    couchdb(req, res, function () {});

    return responseObject;
}

module.exports = {
    name: 'unexpected-mock-couchdb',
    installInto: function () {
        expect.installPlugin(require('unexpected-mitm'));

        expect.addAssertion('with couchdb mocked out', function (expect, subject, couchdb) {
            this.errorMode = 'nested';

            var nextAssertionArgs = this.args.slice(1);
            var args = [subject, 'with http mocked out', {
                response: function (requestProperties) {
                    return generateCouchdbResponse(couchdb, requestProperties);
                }
            }].concat(nextAssertionArgs);

            return expect.apply(expect, args);
        });
        
    }
};