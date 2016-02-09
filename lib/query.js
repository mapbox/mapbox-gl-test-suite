var path = require('path');
var harness = require('./harness');
var deepEqual = require('deep-equal');
var diff = require('diff');
var PNG = require('pngjs').PNG;
var fs = require('fs');

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
        query(style, params, function(err, data, results) {
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

                params.difference = msg;
                console.log(msg);
            }

            var width = params.width * params.pixelRatio;
            var height = params.height * params.pixelRatio;
            var x, y;

            if (params.at) {
                var at = params.at;
                var d = 30;
                drawAxisAlignedLine([at[0] - d, at[1]], [at[0] + d, at[1]], data, width, height, [255, 0, 0, 255]);
                drawAxisAlignedLine([at[0], at[1] - d], [at[0], at[1] + d], data, width, height, [255, 0, 0, 255]);
            }

            var dir = path.join(directory, params.group, params.test);
            var actual = path.join(dir, 'actual.png');

            var png = new PNG({
                width: params.width * params.pixelRatio,
                height: params.height * params.pixelRatio
            });

            png.data = data;

            png.pack()
                .pipe(fs.createWriteStream(actual))
                .on('finish', function() {
                    params.actual = fs.readFileSync(actual).toString('base64');
                    done();
                });
        });
    });
};

function drawAxisAlignedLine(a, b, pixels, width, height, color) {
    var fromX = clamp(Math.min(a[0], b[0]), 0, width);
    var toX = clamp(Math.max(a[0], b[0]), 0, width);
    var fromY = clamp(Math.min(a[1], b[1]), 0, height);
    var toY = clamp(Math.max(a[1], b[1]), 0, height);

    var index;
    if (fromX === toX) {
        for (var y = fromY; y <= toY; y++) {
            index = getIndex(fromX, y);
            pixels[index + 0] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
            pixels[index + 3] = color[3];
        }
    } else {
        for (var x = fromX; x <= toX; x++) {
            index = getIndex(x, fromY);
            pixels[index + 0] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
            pixels[index + 3] = color[3];
        }
    }

    function getIndex(x, y) {
        return (y * width + x) * 4;
    }
}

function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
}
