function getContent () {



  response=`
  <tr>
  <td>
  ${arguments[0].hash.viewData.id}:
  </td><td>${arguments[0].hash.viewData.name}</td>
  <td>${arguments[0].hash.viewData.ngr1}</td>
  <td>${arguments[0].hash.viewData.meansOfAbstraction}</td>
  </tr>
  `


  return response

}

module.exports = {
  getContent: getContent
}
