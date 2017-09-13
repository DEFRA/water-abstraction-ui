const baseFilePath = __dirname + '/../public/data/licences/'
const Helpers = require('./helpers')
const Session = require('./session')
// const DB = require('./db')
var httpRequest = require('request')



function makeURIRequest (uri, cb) {
  httpRequest(uri+'?token='+process.env.JWT_TOKEN, function (error, response, body) {
    var data = JSON.parse(body)
    cb(data)
  })
}

function makeURIPostRequest(uri,data,cb){

  console.log('make http post')
  console.log('to '+uri+' with')
  console.log(data)
  httpRequest.post({
            url: uri+'?token='+process.env.JWT_TOKEN,
            form: data
        },
        function (err, httpResponse, body) {
            console.log('got http post')


//            console.log(err, body);
            cb({err:err,data:body})

        });
}

function login (id,password, cb) {
  var data={username:id,password:password}
  console.log(process.env.apiURI+'tactical/user/login')
  makeURIPostRequest(process.env.apiURI+'tactical/user/login', data, (result) => {
//    console.log('got login response')
//    console.log(result)
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

function listLicences
 (request, reply, cb) {
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

function useShortcode(shortcode,cookie,cb){
  console.log('use shortcode request - step 2')
  //{"user_id":2}
  //sessionCookie
  console.log(  cookie)
  var postBody={sessionCookie : cookie}
  var URI = process.env.apiURI + 'shortcode/' + shortcode
  console.log(URI)
  console.log(postBody)
  makeURIPostRequest(URI, postBody,function (error, response, body) {


    cb(error,response,body)
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
  user:{login: login,useShortcode:useShortcode}
}
