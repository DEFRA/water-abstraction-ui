
const pathToTemplates=__dirname+'/../views/partials/jsPartials/'

require('fs').readdirSync(pathToTemplates).forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    console.log(`registered template ${pathToTemplates}${file} as ${name}`)
    exports[name] = require(pathToTemplates+file);
  }
});

/**

function wr () {
  var wrType = arguments[0].type
  var wrSubtype = arguments[0].subtype
  var wrAttributes = arguments[0].attributes

  // TODO: renderers for individual WR components
  switch (wrType) {
    case "21":
      switch (wrSubtype) {
        case "3":
          var response = `WR ${wrType}.${wrSubtype}: At National Grid Reference ${wrAttributes.ngr} marked ‘${wrAttributes.point_ref}’ on the map. `
          break
        default:
          var response = `Generic WR ${wrType} with data ${JSON.stringify(wrAttributes)}`
      }
      break
    default:
      var response = `Generic WR  component for WR ${wrType}.${wrSubtype} with data ${JSON.stringify(wrAttributes)}`
  }

  return response
}

module.exports = {
  WR: wr
}
**/
