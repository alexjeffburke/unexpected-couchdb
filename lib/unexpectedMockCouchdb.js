var expect = require('unexpected');
var url = require('url');

function generateCouchdbResponse(couchdb, request) {
    var urlParts = request.path.split('/');
    var requestDatabase = urlParts[1];
    var tmp;

    if (requestDatabase) {
        if (couchdb[requestDatabase]) {
            tmp = couchdb[requestDatabase].docs || [];

            return {
                statusCode: 200,
                body: {
                    db_name: requestDatabase,
                    doc_count: tmp.length,
                    doc_del_count: 0,
                    update_seq: 0,
                    purge_seq: 0,
                    compact_running: false,
                    disk_size: 1,
                    data_size: 0,
                    instance_start_time: Date.now(),
                    disk_format_version: 6,
                    committed_update_seq: 0
                }
            };
        } else {
            return {
                statusCode: 404,
                body: {
                    error: 'not_found',
                    reason: 'no_db_file'
                }
            };
        }
    }
}

module.exports = {
    name: 'unexpected-mock-couchdb',
    installInto: function () {
        expect.installPlugin(require('unexpected-mitm'));

        expect.addAssertion('with couchdb mocked out', function (expect, subject, couchdb) {
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