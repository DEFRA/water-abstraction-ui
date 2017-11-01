var request = require('request')

function makeURIRequest (uri, data, cb) {
  request({
    method: 'POST',
    headers: {'content-type':'application/json'},
    url: process.env.apiURI + uri + '?token=' + process.env.JWT_TOKEN,
    json: data
  }, cb)
}

function exportLicence(licence, orgId, licenceTypeId) {
  var requestBody = {
      licence_ref: licence.id,
      licence_start_dt: "2017-01-01T00:00:00.000Z",
      licence_end_dt: "2018-01-01T00:00:00.000Z",
      licence_status_id: "1",
      licence_type_id: licenceTypeId,
      licence_org_id: orgId,
      attributes: {
        "licenceData": licence
    }
  }

  makeURIRequest ('regime/' + orgId + '/licencetype/' + licenceTypeId + '/licence', requestBody, function (error,body) {
    if (error) {
      console.log(error);
    }
    console.log(body.body.data.licence_id)
    //use licence id to create CRM record



    var request = require("request");
    var data={}
    data.regime_entity_id='0434dc31-a34e-7158-5775-4694af7a60cf'
    data.owner_entity_id= '8f51dfd9-29a3-593f-c297-437e4181b08d'
      data.system_id= 'permit-repo'
      data.system_internal_id= body.body.data.licence_id
      data.system_external_id= licence.id
      data.metadata='{"Name":"'+licence.name+'"}'
      console.log('-----')
      console.log(data)

      request.post({
                  url: process.env.CRM_URI+'/documentHeader?token='+process.env.JWT_TOKEN,
                  form: data
              },
              function (err, httpResponse, body) {
                  console.log('got http post')
                  console.log(err, body);


              });









  })
}

module.exports = {
  exportLicence : exportLicence
}
