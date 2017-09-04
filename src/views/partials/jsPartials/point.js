function getContent () {

console.log('get content----')
  console.log(arguments[0])

  response=`
  ${arguments[0].hash.viewData.id}: ${arguments[0].hash.viewData.name} (${arguments[0].hash.viewData.ngr1})
  ${arguments[0].hash.viewData.meansOfAbstraction}
  `


  return response

}

module.exports = {
  getContent: getContent
}
