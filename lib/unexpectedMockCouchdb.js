var BufferedStream = require('bufferedstream');
var createMockCouchAdapter = require('./createMockCouchAdapter');
var http = require('http');
var mockCouch = require('mock-couch-alexjeffburke');
var url = require('url');

function generateCouchdbResponse(databases, req, res) {
    var responseObject = null;

    var couchdbHandler = createMockCouchAdapter();
    var couchdb = new mockCouch.MockCouch(couchdbHandler, {});

    Object.keys(databases).forEach(function (databaseName) {
        couchdb.addDB(databaseName, databases[databaseName].docs || []);
    });

    // run the handler
    couchdbHandler(req, res, function () {});
}

module.exports = {
    name: 'unexpected-couchdb',
    installInto: function (expect) {
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