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

The contents of vector tile fixtures can be read using the [`vt2geojson`](https://github.com/mapbox/vt2geojson) tool

## Running tests

Run `npm run test-suite` in mapbox-gl-js or mapbox-gl-native. To view the results graphically, run:

```
open ./node_modules/mapbox-gl-test-suite/render-tests/index.html
```
or
```
open ./node_modules/mapbox-gl-test-suite/query-tests/index.html
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

### Reading Vector Tile Fixtures

Install `vt2geojson`, a command line utility which turns vector tiles into geojson, and `harp`, a simple file server.

```
npm install -g vt2geojson harp
```

Start a static file server
```
harp server .
```

Read the contents of an entire vector tile

```
vt2geojson -z 14 -y 8803 -x 5374 http://localhost:9000/tiles/14-8803-5374.vector.pbf
```

Read the contents of a particular layer in a vector tile

```
vt2geojson --layer poi_label -z 14 -y 8803 -x 5374 http://localhost:9000/tiles/14-8803-5374.vector.pbf
```
