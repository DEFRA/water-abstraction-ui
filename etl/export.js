var request = require('request')

function makeURIRequest (uri, data, cb) {
  request({
    method: 'POST',
    headers: {'content-type':'application/json'},
    url: process.env.apiURI + uri + '?token=' + process.env.JWT_TOKEN,
    json: data
  }, cb)
}

function exportLicence(licence) {
  var requestBody = {
      licence_ref: licence.id,
      licence_start_dt: "2017-01-01T00:00:00.000Z",
      licence_end_dt: "2018-01-01T00:00:00.000Z",
      licence_status_id: "1",
      licence_type_id: "1",
      licence_org_id: "1",
      attributes: {
        "FlowConditions": [],
        "SourceOfSupplyTest": [],
        "Records": "Dummy",
        "MeansOfMeasurement": licence.purposes[0].meansOfMeasurement,
        "LicenceEffectiveTo": licence.effectiveTo,
        "LicenceEffectiveFrom": licence.effectiveFrom,
        "PeriodOfAbstraction": licence.purposes[0].periodOfAbstraction,
        "SourceOfSupply": licence.sourceOfSupply,
        "PointOfAbstraction": licence.purposes[0].points[0].name,
        "LicenceHolder": licence.name,
        "MaximumQuantities": licence.maxQuantity,
        "LicenceHolderAddress": licence.address,
        "LicenceHolderName": licence.name,
        "LicenceHolderEmail": "dummy@email.com",
        "LicenceHolderTelephone": "01234 567 890",
        "MeansOfAbstraction": licence.purposes[0].points[0].meansOfAbstraction,
        "PurposeOfAbstraction": licence.purposes[0].description
    }
  }

  makeURIRequest ('org/1/licencetype/1/licence', requestBody, function (error) {
    if (error) {
      console.log(error);
    }
  })
}

module.exports = {
  exportLicence : exportLicence
}
