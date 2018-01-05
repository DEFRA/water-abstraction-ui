const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(process.env.NOTIFY_KEY);

function sendNewUserPasswordReset(emailAddress, resetGuid) {
  const link = process.env.base_url + '/create-password?resetGuid=' + resetGuid;
  return notifyClient
    .sendEmail('3d25b496-abbd-49bb-b943-016019082988', emailAddress, {
      personalisation: { link }
  });
}
function sendExistingUserPasswordReset(emailAddress, resetGuid) {
  const link = process.env.base_url + '/signin';
  const resetLink = process.env.base_url + '/reset_password_change_password?resetGuid=' + resetGuid;
  return notifyClient
    .sendEmail('d9654596-a533-47e9-aa27-2cf869c6aa13', emailAddress, {
      personalisation: { link, resetLink }
  });
}

/**
 * Sends a letter contaning a security code to the user.
 * In environments other than production, this is skipped and the
 * the function always resolves.
 *
 * @param {Object} licence - licence document header data from CRM
 * @param {String} accesscode - code user receives in post to verify access
 * @return {Promise} resolves with object if successful
 */
function sendSecurityCode(licence, accesscode) {
  // Get address components from licence
  const {AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County, Postcode : postcode, Name : licenceholder} = licence.metadata;

  // Filter out non-null lines
  const lines = [AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County].filter(str => str.trim());

  // Format personalisation with address lines and postcode
  const personalisation = lines.reduce((memo, line, i) => {
    memo[`address_line_${ i+1 }`] = line;
    return memo;
  }, {
    accesscode,
    siteaddress: process.env.base_url,
    licenceholder,
    postcode
  });

  // Don't send letters unless production
  if((process.env.NODE_ENV || '').match(/^production|preprod$/i)) {
      return NotifyClient
        .sendLetter('d48d29cc-ed03-4a01-b496-5cce90beb889', {
          personalisation
        });
  }
  // Mock a response
  else {
    console.log(`Environment is ${process.env.NODE_ENV} - skipping sending security code letter`, {personalisation});
    return Promise.resolve({
      id : 'guid'
    });
  }

}






function sendAccesseNotification(params) {


    return new Promise((resolve, reject) => {
      console.log('in notify function!')
      console.log(params)

      var NotifyClient = require('notifications-node-client').NotifyClient,
        notifyClient = new NotifyClient(process.env.NOTIFY_KEY);

        if(params.newUser){
      console.log('NEW USER')
          var templateId = '145e2919-da41-4f4d-9570-17f5bb12f119'
          var link=`${process.env.base_url}/reset_password`
          var personalisation = {
            link:link,
            email:params.email,
            sender:params.sender
          }

        } else {
      console.log('EXISTING USER')
          var templateId = '725e399e-772b-4c91-835b-68f4995ab6ff'
          var link=`${process.env.base_url}?access=PB01`
          var personalisation = {
            link:link,
            email:params.email,
            sender:params.sender

          }

        }



      var emailAddress = params.email
      console.log('**********personalisation**********')
      console.log(personalisation)
      notifyClient
        .sendEmail(templateId, emailAddress, {
			personalisation: personalisation})
        .then((response) => {
          console.log('response from notify OK')
          return resolve (true)
        })
        .catch((err) => {
          console.log('Error occurred sending notify email')
          console.log(err.message)
          return resolve (true)
        });

    });


}



module.exports = {
  sendAccesseNotification: sendAccesseNotification,
  sendNewUserPasswordReset,
  sendExistingUserPasswordReset,
  sendSecurityCode
};
