const Helpers = require('../helpers');
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  });
const { APIClient } = require('hapi-pg-rest-api');
const client = new APIClient(rp, {
  endpoint : process.env.IDM_URI + '/user',
  headers : {
    Authorization : process.env.JWT_TOKEN
  }
});



/**
 * Check reset guid
 * @param {String} resetGuid - the password reset GUID issued by email
 * @return {Promise} resolves with user record if found or null otherwise
 */
async function getUserByResetGuid(reset_guid) {
  const {error, data} = await client.findMany({reset_guid});
  if(error) {
    throw error;
  }
  return data.length === 1 ? data[0] : null;
}


/**
 * Create user account in registration process
 * No password is supplied so a random GUID is used as a
 * temporary password, and the user is flagged for password reset
 * @param {String} emailAddress - the user email address
 * @return {Promise} - resolves if user account created
 */
function createUserWithoutPassword(emailAddress) {
    return client.create({
          user_name : emailAddress,
          password : Helpers.createGUID(),
          reset_guid : Helpers.createGUID(),
          admin : 0,
          user_data : '{}',
          reset_required : 1
    });
}

/**
 * Get user by numeric ID/email address
 * @param {String|Number} numeric ID or string email address
 * @return {Promise} resolves with user if found
 */
 function getUser(user_id) {
   return client.findOne(user_id);
 }

function login(user_name, password){
  return new Promise((resolve, reject) => {
    var data = { user_name:user_name, password:password }
    var uri=process.env.IDM_URI + '/user/login'+ '?token=' + process.env.JWT_TOKEN
    var method='post'
    Helpers.makeURIRequestWithBody(uri, method, data)
    .then((response)=>{
      // console.log('login response')
      // console.log(response.body)
      response.body.sessionGUID=Helpers.createGUID()
        resolve(response)
    }).catch((response)=>{
      // console.log(response)
      // console.log('rejecting in idm.login')
      reject(response)
    })

  });

}


/**
 * Send password reset email
 * @param {String} emailAddress - the user email address to send password reset email to
 * @return {Promise} - resolves with HTTP response
 */
function resetPassword(emailAddress){
  console.log('Depracated');
  return rp({
    uri : process.env.IDM_URI + '/resetPassword',
    method : 'POST',
    json : true,
    headers : {
      Authorization : process.env.JWT_TOKEN
    },
    body : {
      emailAddress
    }
  });
}

/**
 * Resets user reset_guid without sending notify email
 * @param {String} emailAddress - the user email address to send password reset email to
 * @return {Promise} - resolves with HTTP response
 */
function resetPasswordQuiet(emailAddress) {
  const reset_guid = Helpers.createGUID();
  return client.updateOne(emailAddress, {
    reset_guid : Helpers.createGUID()
  });
}

function getPasswordResetLink (emailAddress) {
  return new Promise((resolve, reject) => {
    var uri = process.env.IDM_URI + '/resetPassword' + '?token=' + process.env.JWT_TOKEN + '&emailAddress=' + emailAddress
    Helpers.makeURIRequest(uri)
    .then((response)=>{
        resolve(response.body)
    }).catch((response)=>{
//      console.log('rejecting in idm.getPasswordResetLink')
      reject(response)
    })

  });
}


/**
 * Updates user password
 * @param {String} username - user's IDM email address
 * @param {String} password - new password
 */
function updatePassword (username, password) {
  return client.updateOne(username, {
    password
  });
}




function updatePasswordWithGuid (resetGuid, password) {


  return new Promise((resolve, reject) => {
    var data = { resetGuid: resetGuid, password: password }
    var uri = process.env.IDM_URI + '/changePassword' + '?token=' + process.env.JWT_TOKEN
    Helpers.makeURIRequestWithBody(uri,'POST', data)
    .then((response)=>{
        resolve(response)
    }).catch((response)=>{
//      console.log('rejecting in idm.updatePasswordWithGuid')
      reject(response)
    })

  });



}


module.exports = {
login:login,
resetPassword,
resetPasswordQuiet,
getPasswordResetLink: getPasswordResetLink,
updatePassword: updatePassword,
updatePasswordWithGuid: updatePasswordWithGuid,
createUserWithoutPassword,
getUser,
getUserByResetGuid

}
