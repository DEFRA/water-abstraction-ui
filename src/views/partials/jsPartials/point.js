function formatGridReference(reference) {
  // The length of one of the numbers in the NGR is the length of the whole thing
  // minus the two letters at the start, then divided by two (as there are two numbers)
  var accuracy = (reference.length - 2)/2
  return reference.substring(0, 2) + ' '
       + reference.substring(2, 2 + accuracy) + ' '
       + reference.substring(2 + accuracy);
}

function getContent () {
  var response =
`<div class="sourceofsupplyq">
  Point of abstraction:
</div>
`
  response +=
`<div class="licenceAnswer">
  `

  if (arguments[0].hash.viewData[0].ngr4) {
    response+= `Within the area formed by the straight lines running between the following National Grid References`
    response+= formatGridReference(arguments[0].hash.viewData[0].ngr1) + ', '
      + formatGridReference(arguments[0].hash.viewData[0].ngr2) + ', '
      + formatGridReference(arguments[0].hash.viewData[0].ngr3) + ', '
      + formatGridReference(arguments[0].hash.viewData[0].ngr4)
  } else if (arguments[0].hash.viewData[0].ngr2) {
    response+=`Between National Grid References ${arguments[0].hash.viewData[0].ngr1} and ${arguments[0].hash.viewData[0].ngr2}`
  } else {
    response+=`At National Grid Reference ${arguments[0].hash.viewData[0].ngr1}`
  }

  response += `
  <br/>
</div>
<p></p>`

  return response

}

module.exports = {
  getContent: getContent
}
