const Helpers = require('../helpers')

function getLicences(user_name) {
  var uri = process.env.CRM_URI + '/entity/' + user_name + '?token=' + process.env.JWT_TOKEN
  return new Promise((resolve, reject) => {
    Helpers.makeURIRequest(uri)
      .then((response) => {
        var data = JSON.parse(response.body)
        resolve(data.data.documentAssociations)
      }).catch((response) => {
        reject(response)
      })
  });
}


function getLicenceInternalID(licences, document_id) {
  /**this function gets the internal ID (i.e. the ID of the licence in the permit repository) from the document_id
  (from the CRM document header record) which can then be used to retrieve the full licence from the repo **/
  return new Promise((resolve, reject) => {
    var thisLicence = licences.find(x => x.document_id === document_id)
    if (thisLicence) {
      resolve(thisLicence)
    } else {
      reject('Licence with ID ' + document_id + ' could not be found.')
    }
  })
}

module.exports = {
  getLicences: getLicences,
  getLicenceInternalID: getLicenceInternalID

}
