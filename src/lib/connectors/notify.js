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




function sendAccesseNotification(params) {


    return new Promise((resolve, reject) => {
      console.log('in notify function!')
      console.log(params)

      var NotifyClient = require('notifications-node-client').NotifyClient,
        notifyClient = new NotifyClient(process.env.NOTIFY_KEY);

        if(params.newUser){
          var templateId = '6563423c-e35e-42f6-b8a5-2f652c9867b1'
          var link=`${process.env.reset_url}`
          var personalisation = {
            title: "title",
            initials:"initials",
            licenceHolderName:"licence holder name",
            link:link

          }

        } else {
          var templateId = '725e399e-772b-4c91-835b-68f4995ab6ff'
          var link=`${process.env.reset_url}`
          var personalisation = {
            link:link
          }

        }

        personalisation = {
          sender_name:"licence holder name",
          weblink:link

        }

      var emailAddress = params.email
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
  sendExistingUserPasswordReset
};
