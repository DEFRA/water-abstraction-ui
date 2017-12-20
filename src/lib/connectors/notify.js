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
};
