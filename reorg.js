var format = require('mapbox-gl-style-spec').format;
var path = require('path');
var fs = require('fs');
var extend = require('extend');

var directory = path.join(__dirname, './render-tests');

fs.readdirSync(directory).forEach(function (group) {
    if (group === 'index.html' || group == 'results.html.tmpl' || group[0] === '.')
        return;

    var style = require(path.join(directory, group, 'style.json')),
        info = require(path.join(directory, group, 'info.json'));

    for (var test in info) {
        fs.writeFileSync(path.join(directory, group, test, 'style.json'), format(transform(style, info[test], group, test)));
    }

    fs.unlinkSync(path.join(directory, group, 'style.json'));
    fs.unlinkSync(path.join(directory, group, 'info.json'));
});

function transform(style, info, group, test) {
    style = JSON.parse(JSON.stringify(style));

    ['center', 'zoom', 'bearing', 'pitch'].forEach(function (key) {
        if (key in info) {
            style[key] = info[key];
            delete info[key];
        }
    });

    style.layers.forEach(function (layer) {
        var paint = extend({}, layer.paint);

        (info.classes || []).forEach(function (klass) {
            if (layer['paint.' + klass]) {
                extend(paint, layer['paint.' + klass]);
            }
        });

        for (var key in layer) {
            if (key.match(/^paint/)) {
                delete layer[key];
            }
        }

        layer.paint = paint;
    });

    if (group.match(/^icon/)) {
        if (group === 'icon-halo-color') {
            style.layers.splice(2, 1);
        } else if (group === 'icon-opacity' && test === 'icon-only') {
            style.layers.splice(1, 1);
            style.layers[1].id = test;
        } else if (group === 'icon-opacity' && test === 'text-only') {
            style.layers.splice(1, 1);
            style.layers[1].id = test;
        } else {
            style.layers = style.layers.filter(function (layer) {
                return layer.paint['icon-opacity'] !== 0;
            });
        }
    }

    if (group.match(/^text/)) {
        style.layers = style.layers.filter(function (layer) {
            return layer.paint['text-opacity'] !== 0;
        });
    }

    if (group.match(/^line/)) {
        style.layers = style.layers.filter(function (layer) {
            return layer.paint['line-opacity'] !== 0;
        });
    }

    delete info.classes;

    style.metadata = { test: info };

    return style;
}
