function getContent () {

console.log('get content----')
  console.log(arguments[0])

  response=JSON.stringify(arguments[0].hash.viewData);
  return response

}

module.exports = {
  getContent: getContent
}
