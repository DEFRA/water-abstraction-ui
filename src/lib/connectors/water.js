const Helpers = require('../helpers')


function sendNotifyMessage(message_ref, recipient, personalisation) {
  return new Promise((resolve, reject) => {
    var uri = `${process.env.WATER_URI}/notify/${message_ref}?token=${process.env.JWT_TOKEN}`
    var requestBody = {
      recipient: recipient,
      personalisation: personalisation
    }
    Helpers.makeURIRequestWithBody(
        uri,
        'post',
        requestBody)
      .then((response) => {
        var data = response.body
        resolve(data)
      }).catch((response) => {
        console.log(response)
        resolve(response)
      })
  });
}


module.exports = {
  sendNotifyMessage
}
