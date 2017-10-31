const Helpers = require('../helpers')

function login(user_name,password){
  return new Promise((resolve, reject) => {
    var data = { user_name:user_name, password:password }
    var uri=process.env.IDM_URI + '/user/login'+ '?token=' + process.env.JWT_TOKEN
    var method='post'
    console.log(uri)
    Helpers.makeURIRequestWithBody(uri, method, data)
    .then((response)=>{
      console.log('login response')
      console.log(response)
      response.body.sessionGUID=Helpers.createGUID()

        resolve(response)



    }).catch((response)=>{
      console.log('rejecting in idm.login')
      reject(response)
    })

  });

}

function resetPassword(emailAddress){
  return new Promise((resolve, reject) => {
    var data = { emailAddress: emailAddress }
    var uri=process.env.IDM_URI + '/resetPassword'+ '?token=' + process.env.JWT_TOKEN
    var method='post'
    console.log(uri)
    Helpers.makeURIRequestWithBody(uri, method, data)
    .then((response)=>{
      console.log('reset password response')
      console.log(response)
        resolve(response)
    }).catch((response)=>{
      console.log('rejecting in idm.resetPassword.login')
      reject(response)
    })

  });



}

function getPasswordResetLink (emailAddress) {
  return new Promise((resolve, reject) => {
    var uri = process.env.IDM_URI + '/resetPassword' + '?token=' + process.env.JWT_TOKEN + '&emailAddress=' + emailAddress
    console.log(uri)
    Helpers.makeURIRequest(uri)
    .then((response)=>{
      console.log('getPasswordResetLink response')
      console.log(response)
        resolve(response.body)
    }).catch((response)=>{
      console.log('rejecting in idm.getPasswordResetLink')
      reject(response)
    })

  });
}

function updatePassword (username, password, cb) {



  return new Promise((resolve, reject) => {
  console.log("Change password: " + username + " " + password)
    var data = { username: username, password: password }
    var uri = process.env.IDM_URI + '/user' + '?token=' + process.env.JWT_TOKEN
    console.log(uri)
    Helpers.makeURIRequestWithBody(uri,'PUT', data)
    .then((response)=>{
      console.log('updatePassword response')
      console.log(response)
        resolve(response)
    }).catch((response)=>{
      console.log('rejecting in idm.updatePassword')
      reject(response)
    })

  });


}




function updatePasswordWithGuid (resetGuid, password, cb) {


  return new Promise((resolve, reject) => {
  console.log("updatePasswordWithGuid: " + resetGuid + " " + password)
    var data = { resetGuid: resetGuid, password: password }
    var uri = process.env.IDM_URI + '/changePassword' + '?token=' + process.env.JWT_TOKEN
    console.log(uri)
    Helpers.makeURIRequestWithBody(uri,'POST', data)
    .then((response)=>{
      console.log('updatePassword response')
      console.log(response)
        resolve(response)
    }).catch((response)=>{
      console.log('rejecting in idm.updatePasswordWithGuid')
      reject(response)
    })

  });



}


module.exports = {
login:login,
resetPassword:resetPassword,
getPasswordResetLink: getPasswordResetLink,
updatePassword: updatePassword,
updatePasswordWithGuid: updatePasswordWithGuid


}
