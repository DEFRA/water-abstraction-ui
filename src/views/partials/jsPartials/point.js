function getContent () {


  var response = `<div class="sourceofsupplyq">${arguments[0].hash.viewData.name}<br>(NGR: ${arguments[0].hash.viewData.ngr1})</div>`
  response += `<div class="licenceAnswer">`


  response+=`${arguments[0].hash.viewData.meansOfAbstraction}
</div><p></p>  `


  return response

}

module.exports = {
  getContent: getContent
}
