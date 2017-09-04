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
          var response = `<tr><td>CES FLOW:<br>`
          if (attributes.parameter1){
              response+=`Param1: ${attributes.parameter1}<br>`
          }
          if (attributes.parameter2){
              response+=`Param2: ${attributes.parameter2}<br>`
          }
          if (attributes.text){
              response+=`${attributes.text}<br>`
          }
          response+=`</td></tr>`
          break
        default:
          var response = `<tr><td>CES ${subCode}:<br>`
          if (attributes.parameter1){
              response+=`Param1: ${attributes.parameter1}<br>`
          }
          if (attributes.parameter2){
              response+=`Param2: ${attributes.parameter2}<br>`
          }
          if (attributes.text){
              response+=`${attributes.text}<br>`
          }
          response+=`</td></tr>`
      }
      break
    default:
    var response = `<tr><td>${code} ${subCode}:<br>`
    if (attributes.parameter1){
        response+=`Param1: ${attributes.parameter1}<br>`
    }
    if (attributes.parameter2){
        response+=`Param2: ${attributes.parameter2}<br>`
    }
    if (attributes.text){
        response+=`${attributes.text}<br>`
    }
    response+=`</td></tr>`
  }

  return response
}






module.exports = {
  getContent: getContent
}
