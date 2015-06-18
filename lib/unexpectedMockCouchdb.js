var BufferedStream = require('bufferedstream');
var createMockCouchAdapter = require('./createMockCouchAdapter');
var expect = require('unexpected');
var http = require('http');
var mockCouch = require('mock-couch-alexjeffburke');
var url = require('url');

function generateCouchdbResponse(databases, request, cb) {
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
        return {
            setHeader: function () {
                // empty
            },
            send: function (statusCode, body) {
                responseObject = {
                    statusCode: statusCode,
                    body: body
                };
            }
        };
    }

    var req = createMockReq(request);
    var res = createMockRes();

    var couchdbHandler = createMockCouchAdapter();
    var couchdb = new mockCouch.MockCouch(couchdbHandler, {});

    Object.keys(databases).forEach(function (databaseName) {
        couchdb.addDB(databaseName, databases[databaseName].docs || []);
    });

    // run the handler
    couchdbHandler(req, res, function () {});

    cb(null, responseObject);
}

module.exports = {
    name: 'unexpected-mock-couchdb',
    installInto: function () {
        expect.installPlugin(require('unexpected-mitm'));

        expect.addAssertion('with couchdb mocked out', function (expect, subject, couchdb) {
            this.errorMode = 'nested';

            var nextAssertionArgs = this.args.slice(1);
            var args = [subject, 'with http mocked out', {
                response: generateCouchdbResponse.bind(null, couchdb)
            }].concat(nextAssertionArgs);

            return expect.apply(expect, args);
        });
        
    }
};