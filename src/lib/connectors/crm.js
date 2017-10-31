const Helpers = require('../helpers')

function getLicences(user_name){
  var uri = process.env.CRM_URI+'/entity/' + user_name + '?token=' + process.env.JWT_TOKEN
  console.log(uri)
  return new Promise((resolve, reject) => {
    Helpers.makeURIRequest(uri)
    .then((response)=>{
      console.log('crm.getLicences entity response')
      console.log(response.body)
      var data=JSON.parse(response.body)
      console.log(data.data.documentAssociations)
        resolve(data.data.documentAssociations)
    }).catch((response)=>{
      console.log('rejecting in crm.getLicences')
      console.log(response)
      reject(response)
    })
  });
}


function getLicenceInternalID(licences,document_id){
  //this function gets the internal ID (i.e. the ID of the licence in the permit repository) from the document_id (from the CRM document header record)
  return new Promise((resolve, reject) => {
    var thisLicence = licences.find(x => x.document_id === document_id)
    if(thisLicence){
        resolve(thisLicence)
    } else {
        reject('Licence with ID '+document_id+' could not be found.')
    }
  })
}

module.exports = {
getLicences:getLicences,
getLicenceInternalID:getLicenceInternalID

}
