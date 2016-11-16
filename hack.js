var fs = require('fs')
var path = require('path')

var file = process.argv[2]

var data = require(path.resolve(file))

var style = Object.assign({}, data)
delete style.metadata

data.metadata.test.operations.unshift([
  'setStyle',
  style
])

fs.writeFileSync(file, JSON.stringify(data, null, 2))

