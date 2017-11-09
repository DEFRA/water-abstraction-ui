const Helpers = require('../helpers')

function getLicence(licence_id){


  console.log('get licence request')


  return new Promise((resolve, reject) => {
      var licenceRegimeId=process.env.licenceRegimeId
      var licenceTypeId=process.env.licenceTypeId


    var uri = process.env.PERMIT_URI + 'regime/' + licenceRegimeId + '/licencetype/' + licenceTypeId + '/licence/' + licence_id+'?token='+process.env.JWT_TOKEN
    console.log(uri)
    Helpers.makeURIRequest(uri).then((response)=>{
      console.log('licence response')
      console.log(response)
      resolve(response)
    }).catch((response)=>{
      console.log(response)
      console.log('rejecting in permit.getLicence')
      reject(response)
    })
  });



}

module.exports = {
getLicence:getLicence
}
