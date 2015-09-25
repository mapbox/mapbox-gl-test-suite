var path = require('path');
var harness = require('./harness');
var deepEqual = require('deep-equal');
var diff = require('diff');

/**
 * Run the query suite.
 *
 * @param {string} implementation - identify the implementation under test; used to
 * deal with implementation-specific test exclusions and fudge-factors
 * @param {Object} options
 * @param {Array<string>} [options.tests] - array of test names to run; tests not in the
 * array will be skipped
 * @param {queryFn} query - a function that performs the query
 * @returns {undefined} terminates the process when testing is complete
 */
exports.run = function (implementation, options, query) {
    var directory = path.join(__dirname, '../query-tests');
    harness(directory, implementation, options, function(style, params, done) {
        query(style, params, function(err, results) {
            if (err) return done(err);

            params.ok = deepEqual(results, params.expected);

            if (!params.ok) {
                var msg = diff.diffLines(
                    JSON.stringify(params.expected, null, 2),
                    JSON.stringify(results, null, 2))
                    .map(function (hunk) {
                        if (hunk.added) {
                            return '+ ' + hunk.value;
                        } else if (hunk.removed) {
                            return '- ' + hunk.value;
                        } else {
                            return '  ' + hunk.value;
                        }
                    })
                    .join('');

                console.log(msg);
            }

            done();
        });
    });
};
