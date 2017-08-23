function getContent () {

console.log('get content----')
  console.log(arguments[0])

  var wrType = arguments[0].hash.viewData.type
  var wrSubtype = arguments[0].hash.viewData.subtype
  var wrAttributes = arguments[0].hash.viewData.attributes

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
  getContent: getContent
}
