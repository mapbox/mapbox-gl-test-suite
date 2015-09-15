'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var st = require('st');
var http = require('http');
var PNG = require('pngjs').PNG;
var spawn = require('child_process').spawn;
var queue = require('queue-async');
var extend = require('extend');
var colors = require('colors/safe');
var handlebars = require('handlebars');

function compare(actual, expected, diff, callback) {
    var child = spawn('compare', ['-metric', 'MAE', actual, expected, diff]);
    var error = '';

    child.stderr.on('data', function (data) {
        error += data.toString();
    });

    child.on('exit', function (code) {
        // The compare program returns 2 on error otherwise 0 if the images are similar or 1 if they are dissimilar.
        if (code === 2) {
            callback(error.trim(), Infinity);
        } else {
            var match = error.match(/^\d+(?:\.\d+)?\s+\(([^\)]+)\)\s*$/);
            var difference = match ? parseFloat(match[1]) : Infinity;
            callback(match ? '' : error, difference);
        }
    });

    child.stdin.end();
}

/**
 * Run the test suite, compute differences to expected values (making exceptions based on
 * implementation vagaries), print results to standard output, write test artifacts to the
 * filesystem (optionally updating expected results), and exit the process with a success or
 * failure code.
 *
 * Caller must supply a `render` function that does the actual rendering and passes the raw image
 * result on to the `render` function's callback.
 *
 * A local server is launched that is capable of serving requests for the source, sprite,
 * font, and tile assets needed by the tests, and the URLs within the test styles are
 * rewritten to point to that server.
 *
 * As the tests run, results are printed to standard output, and test artifacts are written
 * to the filesystem. If the environment variable `UPDATE` is set, the expected artifacts are
 * updated in place based on the test rendering.
 *
 * If all the tests are successful, this function exits the process with exit code 0. Otherwise
 * it exits with 1. If an unexpected error occurs, it exits with -1.
 *
 * The implementation depends on the presence of the `compare` binary from imagemagick.
 *
 * @param {string} implementation - identify the implementation under test; used to
 * deal with implementation-specific test exclusions and fudge-factors
 * @param {Object} options
 * @param {Array<string>} [options.tests] - array of test names to run; tests not in the
 * array will be skipped
 * @param {renderFn} render - a function that performs the rendering
 * @returns {undefined} terminates the process when testing is complete
 */
exports.run = function (implementation, options, render) {
    var q = queue(1);
    var server = http.createServer(st({path: __dirname}));

    q.defer(server.listen.bind(server), 2900);

    fs.readdirSync(path.join(__dirname, 'tests')).forEach(function (group) {
        if (group === 'index.html' || group[0] === '.')
            return;

        if (options.tests && options.tests.indexOf(group) < 0)
            return;

        var style = require(path.join(__dirname, 'tests', group, 'style.json')),
            info = require(path.join(__dirname, 'tests', group, 'info.json'));

        function localURL(url) {
            return url.replace(/^local:\/\//, 'http://localhost:2900/');
        }

        for (var k in style.sources) {
            var source = style.sources[k];

            for (var l in source.tiles) {
                source.tiles[l] = localURL(source.tiles[l]);
            }

            if (source.urls) {
                source.urls = source.urls.map(localURL);
            }

            if (source.url) {
                source.url = localURL(source.url);
            }
        }

        if (style.sprite) {
            style.sprite = localURL(style.sprite);
        }

        if (style.glyphs) {
            style.glyphs = localURL(style.glyphs);
        }

        for (var test in info) {
            var params = extend({
                group: group,
                test: test,
                width: 512,
                height: 512,
                pixelRatio: 1,
                zoom: 0,
                bearing: 0,
                classes: [],
                center: [0, 0],
                allowed: 0.001
            }, info[test]);

            if ('diff' in params) {
                if (typeof params.diff === 'number') {
                    params.allowed = params.diff;
                } else if (implementation in params.diff) {
                    params.allowed = params.diff[implementation];
                }
            }

            params.ignored = params.ignored && implementation in params.ignored;

            if (params[implementation] === false) {
                console.log(colors.gray('* skipped ' + params.group + ' ' + params.test));
            } else {
                q.defer(runOne, params);
            }
        }

        function runOne(params, callback) {
            var watchdog = setTimeout(function () {
                callback(new Error('timed out after 20 seconds'));
            }, 20000);

            render(style, params, function (err, data) {
                clearTimeout(watchdog);

                if (err) return callback(err);

                var dir = path.join(__dirname, 'tests', params.group, params.test);
                var expected = path.join(dir, 'expected.png');
                var actual   = path.join(dir, 'actual.png');
                var diff     = path.join(dir, 'diff.png');

                var png = new PNG({
                    width: params.width * params.pixelRatio,
                    height: params.height * params.pixelRatio
                });

                png.data = data;

                if (process.env.UPDATE) {
                    png.pack()
                        .pipe(fs.createWriteStream(expected))
                        .on('finish', callback);
                } else {
                    png.pack()
                        .pipe(fs.createWriteStream(actual))
                        .on('finish', function () {
                            compare(actual, expected, diff, function (err, difference) {
                                if (err) return callback(err);

                                params.difference = difference;
                                params.ok = difference <= params.allowed;

                                params.actual = fs.readFileSync(actual).toString('base64');
                                params.expected = fs.readFileSync(expected).toString('base64')
                                params.diff = fs.readFileSync(diff).toString('base64');

                                if (params.ignored && !params.ok) {
                                    params.color = 'white';
                                    console.log(colors.white('* ignore ' + params.group + ' ' + params.test));
                                } else if (params.ignored) {
                                    params.color = 'yellow';
                                    console.log(colors.yellow('* ignore ' + params.group + ' ' + params.test));
                                } else if (!params.ok) {
                                    params.color = 'red';
                                    console.log(colors.red('* failed ' + params.group + ' ' + params.test));
                                } else {
                                    params.color = 'green';
                                    console.log(colors.green('* passed ' + params.group + ' ' + params.test));
                                }

                                callback(null, params);
                            });
                        });
                }
            });
        };
    });

    q.defer(server.close.bind(server));

    q.awaitAll(function (err, results) {
        if (err) {
            console.error(err);
            process.exit(-1);
        }

        results = results.slice(1, -1);

        if (process.env.UPDATE) {
            console.log('Updated ' + results.length + ' tests.');
            process.exit(0);
        }

        var passedCount = 0,
            ignoreCount = 0,
            ignorePassCount = 0,
            failedCount = 0;

        results.forEach(function (params) {
            if (params.ignored && !params.ok) {
                ignoreCount++;
            } else if (params.ignored) {
                ignorePassCount++;
            } else if (!params.ok) {
                failedCount++;
            } else {
                passedCount++;
            }
        });

        var totalCount = passedCount + ignorePassCount + ignoreCount + failedCount;

        if (passedCount > 0) {
            console.log(colors.green('%d passed (%s%)'),
                passedCount, (100 * passedCount / totalCount).toFixed(1));
        }

        if (ignorePassCount > 0) {
            console.log(colors.yellow('%d passed but were ignored (%s%)'),
                ignorePassCount, (100 * ignorePassCount / totalCount).toFixed(1));
        }

        if (ignoreCount > 0) {
            console.log(colors.white('%d ignored (%s%)'),
                ignoreCount, (100 * ignoreCount / totalCount).toFixed(1));
        }

        if (failedCount > 0) {
            console.log(colors.red('%d failed (%s%)'),
                failedCount, (100 * failedCount / totalCount).toFixed(1));
        }

        var template = handlebars.compile(
            fs.readFileSync(path.join(__dirname, 'templates', 'results.html.tmpl')).toString());

        var p = path.join(__dirname, 'tests', 'index.html');
        fs.writeFileSync(p, template({results: results}));
        console.log('Results at: ' + p);

        process.exit(failedCount === 0 ? 0 : 1);
    });
};

/**
 * @callback renderFn
 * @param {Object} style - style to render
 * @param {Object} options
 * @param {number} options.width - render this wide
 * @param {number} options.height - render this high
 * @param {number} options.pixelRatio - render with this pixel ratio
 * @param {Array<number>} options.center - render at this [lon, lat]
 * @param {number} options.zoom - render at this zoom level
 * @param {Array<string>} options.classes - render with these style classes
 * @param {renderCallback} callback - callback to call with the results of rendering
 */

/**
 * @callback renderCallback
 * @param {?Error} error
 * @param {Buffer} [result] - raw RGBA image data
 */
