Verify correctness and consistency of [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) and
[mapbox-gl-native](https://github.com/mapbox/mapbox-gl-native) rendering.

## Organization

Tests are in subdirectories of `tests/`, organized by [style specification](https://github.com/mapbox/mapbox-gl-style-spec)
property: `background-color`, `line-width`, etc.

Within each subdirectory are `style.json`, which contains the minimal style needed to test the given property,
and `info.json`, which contains one or more test cases for the given property. Each test case is identified by an id,
and specifies values such as the map size, coordinates, and style classes. The expected output for a given test case
is in `{id}/expected.png`, e.g. [`tests/background-color/constant/expected.png`](https://github.com/mapbox/mapbox-gl-test-suite/blob/master/tests/background-color/constant/expected.png).

Supporting files -- glyphs, sprites, and tiles -- live in their own respective subdirectories. The test
harness sets up the environment such that requests for these resources are directed to the correct location.

## Running tests

Run `npm run test-suite` in mapbox-gl-js or mapbox-gl-native. To view the results graphically, run:

```
open ./node_modules/mapbox-gl-test-suite/tests/index.html
```

When run via Travis, the test artifacts are uploaded to S3 as a permanent record of results. Near the
end of the Travis output is a link to the result, for example:

http://mapbox.s3.amazonaws.com/mapbox-gl-native/tests/5952.10/index.html

## Writing new tests

Expected results are always generated with the **js** implementation. This is merely for consistency and does not
imply that in the event of a rendering discrepancy, the js implementation is always correct.

```
cd mapbox-gl-test-suite
[add/edit tests]
npm link
cd ../mapbox-gl-js
npm link mapbox-gl-test-suite
UPDATE=1 npm run test-suite
[review and commit changes to mapbox-gl-test-suite]
```

You can use the `read_vector_tile.js` script to inspect the vector tile fixtures

 - `read_vector_tile.js` to display the help message
 - `read_vector_tile.js [file]` to list all layers within `file` in a human-readable format.
 - `read_vector_tile.js [file] [layer]` to list all features within `layer` as GeoJSON
