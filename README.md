Verify correctness and consistency of [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) and
[mapbox-gl-native](https://github.com/mapbox/mapbox-gl-native) rendering.

## Organization

Tests are in subdirectories of `tests/`, organized by [style specification](https://github.com/mapbox/mapbox-gl-style-spec)
property: `background-color`, `line-width`, etc.

Within each subdirectory are `style.json`, which contains the minimal style needed to test the given property,
and `info.json`, which contains one or more test cases for the given property. Each test case is identified by an id,
and specifies values such as the map size, coordinates, and style classes. The expected output for a given test case
is in `{id}/expected.png`, e.g. [`tests/background-color/constant/expected.png`](https://github.com/mapbox/mapbox-gl-test-suite/blob/master/tests/background-color/constant/expected.png).

Supporting files -- glyphs, sprites, and tiles -- live in their own respective subdirectories. The js and native test
harnesses set up the environment such that requests for these resources are directed to the correct location.

## Running tests

JS:

```
cd mapbox-gl-js
npm install
node test/render.test.js
open ./node_modules/mapbox-gl-test-suite/tests/index.html
```

Native:

```
cd mapbox-gl-native
git submodule update --init test/suite
make test-Headless* && (cd ./test/suite/ && ./bin/compare_images.py)
open ./test/suite/tests/index.html
```

This generates `actual.png` files along side each `expected.png` as well as a `diff.png` showing any differences between
the two. It also generates `tests/index.html` which allows you to browse the complete results.

When run via Travis, the resulting `tests/` directory tree is uploaded to S3 as a permanent record of results. Near the
end of the Travis output is a link to the result, for example:

http://mapbox-gl-testing.s3.amazonaws.com/headless/mapbox/mapbox-gl-js/1385.1/index.html

## Writing new tests

Expected results are always generated with the **js** implementation. This is merely for consistency and does not
imply that in the event of a rendering discrepancy, the js implementation is always correct.

```
cd mapbox-gl-test-suite
[add/edit tests]
npm link
cd ../mapbox-gl-js
npm link mapbox-gl-test-suite
UPDATE=1 node test/rendering.test.js
[review and commit changes to mapbox-gl-test-suite]
```
