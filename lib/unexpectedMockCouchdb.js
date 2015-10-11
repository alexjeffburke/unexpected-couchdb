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
    version: require('../package.json').version,
    installInto: function (expect) {
        expect.installPlugin(require('unexpected-mitm'));

        expect.addAssertion('<any> with couchdb mocked out <object> <assertion>', function (expect, subject, couchdb) {
            expect.errorMode = 'nested';

            return expect(function () {
                return expect.shift();
            }, 'with http mocked out', {
                response: generateCouchdbResponse.bind(null, couchdb)
            }, 'not to error');
        });
    }
};
