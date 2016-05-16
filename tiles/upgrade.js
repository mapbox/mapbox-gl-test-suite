var mapnik = require('mapnik');
var fs = require('fs');
var async = require('async');

function upgrade(z, x, y, path, callback) {
    console.log('Updating ', path);
    var buffer = fs.readFileSync(path);
    var vt = new mapnik.VectorTile(z, x, y);
    vt.addData(buffer, {upgrade: true, validate: true}, function(err) {
      if (err) throw err;
      fs.writeFileSync(path, vt.getDataSync());
      callback();
  });
}

function createExtent1024(callback) {
    console.log('Creating extent1024');
    var buffer = fs.readFileSync('14-8802-5374.mvt');
    var vt = new mapnik.VectorTile(14, 8802, 5374, { tileSize: 1024 });
    vt.addData(buffer, {validate: true}, function(err) {
      if (err) throw err;
      fs.writeFileSync('extent1024-14-8802-5374.mvt', vt.getDataSync());
      callback();
    });
}

async.series([
    upgrade.bind(this, 0, 0, 0, '0-0-0.mvt'),
    upgrade.bind(this, 14, 8802, 5374, '14-8802-5374.mvt'),
    upgrade.bind(this, 14, 8802, 5375, '14-8802-5375.mvt'),
    upgrade.bind(this, 14, 8803, 5374, '14-8803-5374.mvt'),
    upgrade.bind(this, 14, 8803, 5375, '14-8803-5375.mvt'),
    upgrade.bind(this, 2, 1, 1, '2-1-1.mvt'),
    upgrade.bind(this, 2, 1, 2, '2-1-2.mvt'),
    upgrade.bind(this, 2, 2, 1, '2-2-1.mvt'),
    upgrade.bind(this, 2, 2, 2, '2-2-2.mvt'),
    upgrade.bind(this, 7, 37, 48, 'counties-7-37-48.mvt'),
    createExtent1024
]);
