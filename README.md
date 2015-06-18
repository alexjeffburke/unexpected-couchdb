unexpected-couchdb
==================

This unexpected plugin enables unit testing requests against a mock couchdb server.

It leverages [unexpected-mitm](https://github.com/unexpectedjs/unexpected-mitm) and the
[mock-couch](https://github.com/chris-l/mock-couch) library integrating them into a neat
assertion. Teh structure of the database is specified declaratively and appropriate
responses generated automatically.

Example
-------

The following example uses [unexpected-http](https://github.com/unexpectedjs/unexpected-http)
to assert the generated response is valid.

```js
var expect = require('unexpected').clone();

expect.installPlugin(require('unexpected-couchdb'));
expect.installPlugin(require('unexpected-http'));

describe('documentation', function () {
    it('should return the contents of myDatabase including the documents', function () {
        return expect('GET /myDatabase/_all_docs?include_docs=true', 'with couchdb mocked out', {
            myDatabase: {
                docs: [
                    {
                        _id: 'myDocument',
                        foo: 'bar',
                        baz: 1
                    }
                ]
            }
        }, 'to yield response', {
            statusCode: 200,
            body: {
                total_rows: 1,
                rows: [
                    {
                        id: 'myDocument',
                        doc: {
                            _id: 'myDocument',
                            foo: 'bar',
                            baz: 1
                        }
                    }
                ]
            }
        });
    });
});
```

License
-------

Licensed under a standard 3-clause BSD license -- see the `LICENSE` file for details.
