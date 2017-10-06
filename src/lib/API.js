const baseFilePath = __dirname + '/../public/data/licences/'
const Helpers = require('./helpers')
const Session = require('./session')
// const DB = require('./db')
var httpRequest = require('request')



function makeURIRequest (uri, cb) {
  makeURIRequestWithBody(uri, 'GET', null, (response) => {
    cb(JSON.parse(response.data))
  });
}

function makeURIRequestWithBody(uri, method, data, cb) {
  console.log('make http ' + method + ' to ' + uri + ' with:')
  console.log(data)

  httpRequest({
            method: method,
            url: uri + '?token=' + process.env.JWT_TOKEN,
            form: data
        },
        function (err, httpResponse, body) {
            console.log('got http ' + method + ' response')
            cb({ err: err, data: body })
        });
}

function login (id,password, cb) {
  var data = { username:id, password:password }
  makeURIRequestWithBody(process.env.apiURI + 'tactical/user/login', 'POST', data, (result) => {
    cb(result)
  })
}

function getFields (request, reply, cb) {
  makeURIRequest(process.env.apiURI, (result) => {
    cb(result)
  })
}

function getOrg (request, reply, cb) {
  httpRequest(process.env.apiURI + 'org/' + request.params.orgId+'?token='+process.env.JWT_TOKEN, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function listLicenceTypes (request, reply, cb) {
// return all licence types for org
  httpRequest(process.env.apiURI + 'org/' + request.params.orgId + '/licencetype?token='+process.env.JWT_TOKEN, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function getLicenceType (request, reply,cb) {
  // return specific licence type definition for org
  httpRequest(process.env.apiURI + 'org/' + request.params.orgId + '/licencetype/' + request.params.typeId+'?token='+process.env.JWT_TOKEN, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function getlicenceTypeFields (request, reply, cb) {
// return specific licence type definition for org
  httpRequest(process.env.apiURI + 'org/' + request.params.orgId + '/licencetype/' + request.params.typeId+'?token='+process.env.JWT_TOKEN, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function listLicences (request, reply, cb) {
// return licence summaries for org & type
  var URI = process.env.apiURI + 'org/' + request.params.orgId + '/licencetype/' + request.params.typeId + '/licence'+'?token='+process.env.JWT_TOKEN
  console.log(URI)
  httpRequest(URI, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function getLicence (request, reply, cb) {
// return specific licence for org & type
//  console.log(data)
  console.log('get licence request')
  var URI = process.env.apiURI + 'org/' + request.params.orgId + '/licencetype/' + request.params.typeId + '/licence/' + request.params.licence_id+'?token='+process.env.JWT_TOKEN
  httpRequest(URI, function (error, response, body) {
    var data = JSON.parse(body)

    cb(data)
  })
}

function useShortcode(shortcode, cookie, cb) {
  console.log('use shortcode request - step 2')
  console.log(cookie)
  var postBody = { sessionCookie : cookie }
  var URI = process.env.apiURI + 'shortcode/' + shortcode
  console.log(URI)
  console.log(postBody)

  makeURIRequestWithBody(URI, 'POST', postBody, function (error, response, body) {
    cb(error, response, body)
  })
}

function updatePassword (username, password, cb) {
  var data = { username: username, password: password }
  console.log("Change password: " + username + " " + password)
  makeURIRequestWithBody(process.env.idmURI + 'user', 'PUT', data, (result) => {
    console.log(result)
    cb(result)
  })
}

function resetPassword (emailAddress, cb) {
  var data = { emailAddress: emailAddress }
  console.log("Reset password: " + emailAddress)
  makeURIRequestWithBody(process.env.idmURI + 'resetPassword', 'POST', data, (result) => {
    console.log(result)
    cb(result)
  })
}

function getPasswordResetLink (emailAddress, cb) {
  var data = { emailAddress: emailAddress }
  console.log("Get reset password link: " + emailAddress)
  makeURIRequestWithBody(process.env.idmURI + 'resetPassword', 'GET', data, (result) => {
    console.log(result)
    cb(result)
  })
}

function updatePasswordWithGuid (resetGuid, password, cb) {
  var data = { resetGuid: resetGuid, password: password }
  console.log("Reset password: " + resetGuid + " " + password)
  makeURIRequestWithBody(process.env.idmURI + 'changePassword', 'POST', data, (result) => {
    console.log(result)
    cb(result)
  })
}

module.exports = {
  system: {getFields: getFields},
  org: {get: getOrg},
  licencetype: {
    list: listLicenceTypes,
    get: getLicenceType,
    getFields: getlicenceTypeFields

  },
  licence: {
    list: listLicences,
    get: getLicence

  },
  user: {
    login: login,
    useShortcode: useShortcode,
    updatePassword: updatePassword,
    resetPassword: resetPassword,
    getPasswordResetLink: getPasswordResetLink,
    updatePasswordWithGuid: updatePasswordWithGuid
  }
}
