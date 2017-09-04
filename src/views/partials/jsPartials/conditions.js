function getContent () {

console.log('get content----')
  console.log(arguments[0])




  var code = arguments[0].hash.viewData.code
  var subCode = arguments[0].hash.viewData.subCode
  var attributes = arguments[0].hash.viewData

  switch (code) {
    case "CES":
      switch (subCode) {
        case "FLOW":
          var response = `<tr><td>CES FLOW: ${attributes.text}</td></tr>`
          break
        default:
          var response = `<tr><td>CES ${subcode}: with data ${JSON.stringify(attributes)}</td></tr>`
      }
      break
    default:
      var response = `<tr><td>${code} ${subCode} with data ${JSON.stringify(attributes)}</td></tr>`
  }

  return response
}






module.exports = {
  getContent: getContent
}
