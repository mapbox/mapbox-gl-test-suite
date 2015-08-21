#!/usr/bin/env node

var vt = require('vector-tile');
var Protobuf = require('pbf');
var FS = require('fs');
var Path = require('path');

if (process.argv.length < 3) {

    console.log("\nUse this script to inspect vector tile fixtures.\n");
    console.log('  `read_vector_tile.js [file]` to list all the layers within `file` in a human-readable format.');
    console.log('  `read_vector_tile.js [file] [layer]` to list all the features within `layer` as GeoJSON.');
    console.log('');

} else {

    var data = FS.readFileSync(process.argv[2]);
    var tile = new vt.VectorTile(new Protobuf(data));

    if (process.argv.length < 4) {
        console.log("\nThis file contains the following layers\n");
        Object.keys(tile.layers).forEach(function(layer) {
            console.log('  - ' + layer);
        });
        console.log('\nRun this command as `read_vector_tile.js [file] [layer]` to see the features within a particular layer.\n');

    } else {
        var layer = tile.layers[process.argv[3]];
        var collection = {type: "FeatureCollection", features: []};

        for (var i = 0; i < layer.length; i++) {
            var feature = layer.feature(i).toGeoJSON(2, 4, 3);
            feature.coordinates = layer.feature(i).loadGeometry();
            collection.features.push(feature);
        }
        console.log(JSON.stringify(collection, null, 2));
    }
}
