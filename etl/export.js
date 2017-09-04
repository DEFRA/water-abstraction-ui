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

  makeURIRequest ('org/' + orgId + '/licencetype/' + licenceTypeId + '/licence', requestBody, function (error) {
    if (error) {
      console.log(error);
    }
  })
}

module.exports = {
  exportLicence : exportLicence
}
