const Helpers = require('../helpers');
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  });



/**
 * Create user account in registration process
 * No password is supplied so a random GUID is used as a
 * temporary password, and the user is flagged for password reset
 * @param {String} email - the user email address
 * @return {Promise} - resolves if user account created
 */
function createUserWithoutPassword(email) {

    // Generate password
    const tempPassword = Helpers.createGUID();

    return rp({
      uri : process.env.IDM_URI + '/user',
      method : 'POST',
      json : true,
      headers : {
        Authorization : process.env.JWT_TOKEN
      },
      body : {
        username : email,
        password : tempPassword,
        admin : 0,
        user_data : '{}',
        reset_required : 1
      }
    });
}

/**
 * Get user by numeric ID/email address
 * @param {String|Number} numeric ID or string email address
 * @return {Promise} resolves with user if found
 */
 function getUser(user_id) {
   return rp({
     uri : process.env.IDM_URI + '/user/' + user_id,
     method : 'GET',
     json : true,
     headers : {
       Authorization : process.env.JWT_TOKEN
     },
     qs : {
       user_id
     }
   });
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

function updatePassword (username, password, cb) {



  return new Promise((resolve, reject) => {
  console.log("Change password: " + username + " " + password)
    var data = { username: username, password: password }
    var uri = process.env.IDM_URI + '/user' + '?token=' + process.env.JWT_TOKEN
    Helpers.makeURIRequestWithBody(uri,'PUT', data)
    .then((response)=>{
        resolve(response)
    }).catch((response)=>{
//      console.log('rejecting in idm.updatePassword')
      reject(response)
    })

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
resetPassword:resetPassword,
getPasswordResetLink: getPasswordResetLink,
updatePassword: updatePassword,
updatePasswordWithGuid: updatePasswordWithGuid,
createUserWithoutPassword,
getUser

}
