const Helpers = require('../lib/helpers')
const User = require('../lib/user')
const View = require('../lib/view')
const Session = require('../lib/session')
const API = require('../lib/API')



function getRoot (request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Water Abstractions Prototype'
  reply.view('water/index', viewContext)
}

function getSignout (request, reply) {
  request.cookieAuth.clear()
  return reply.redirect('/');
}

function getSignin (request, reply) {
  //get signin page


  if(request.path != '/signin'){
    request.session.postlogin=request.path
  } else {
    request.session.postlogin='/licences'
  }
  console.log('postlogin set to '+request.session.postlogin)
  request.session.id=Helpers.createGUID()
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  reply.view('water/signin', viewContext)
}

function postSignin (request, reply) {


  //post from signin page
  if (request.payload && request.payload.user_id && request.payload.password) {
    User.authenticate(request.payload.user_id, request.payload.password,(getUser)=>{
    var data = JSON.parse(getUser.data)
    if (!data.error) {

      console.log('user login success')

      var session = request.session


      var getUser=JSON.parse(getUser.data)
      console.log('postlogin get as '+request.session.postlogin)
      request.session.user = getUser.sessionGuid
      request.session.cookie=getUser.sessionCookie
      request.session.licences=getUser.licences



          request.cookieAuth.set({ sid: getUser.sessionGuid });
          return reply.redirect(request.session.postlogin);




    } else {
      console.log('user login failure')
      var viewContext = View.contextDefaults(request)
      viewContext.payload = request.payload
      viewContext.errors = {}
      viewContext.errors['authentication'] = 1
      viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
      reply.view('water/signin', viewContext)
    }
  });
  } else {
    console.log('incomplete form data for login')
    var viewContext = View.contextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
    viewContext.payload = request.payload
    viewContext.errors = {}
    if (!request.payload.user_id) {
      viewContext.errors['user-id'] = 1
    }

    if (!request.payload.password) {
      viewContext.errors['password'] = 1
    }

    reply.view('water/signin', viewContext)
  }
}

function getLicences (request, reply) {
  //get licences for user
  var viewContext = View.contextDefaults(request)





  var viewContext = View.contextDefaults(request)
  if(request.session.licences){
  viewContext.licenceData = request.session.licences.data
} else {
viewContext.licenceData=[]
}

  viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
  reply.view('water/licences', viewContext)
}

function verifyUserLicenceAccess(licence_id,licences,cb){
  console.log('------------Params ->')
  console.log(licence_id)
  var canAccessLicence=false
  for(licence in licences){
    if(licence_id==licences[licence].licence_id){
      canAccessLicence=true
    }
    console.log(licences[licence].licence_id)
  }
  cb(canAccessLicence)
}

function getLicence (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.contextDefaults(request)
  console.log(request.session)


  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {

    verifyUserLicenceAccess(request.params.licence_id,request.session.licences.data,(access)=>{
      console.log('access: '+access)
        request.params.orgId = process.env.licenceOrgId
        request.params.typeId= process.env.licenceTypeId


        API.licence.get(request,reply,(data)=>{

          if(data.error){
            var viewContext = View.contextDefaults(request)
            console.log(JSON.stringify(data))
            viewContext.error = data.error
            viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
            viewContext.error='Licence not found'
            console.log(viewContext.error)
            reply.view('water/licence_error', viewContext)
          } else if (!access){
            var viewContext = View.contextDefaults(request)
            viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
            viewContext.error='You are not authorised to view this licence'
            console.log(viewContext.error)
            reply.view('water/licence_error', viewContext)
          } else {
            var viewContext = View.contextDefaults(request)
            console.log(JSON.stringify(data))
            viewContext.licenceData = data.data
            viewContext.debug.licenceData = viewContext.licenceData
            viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
            reply.view('water/licence', viewContext)
          }
        })
    })


  }
}

function getLicenceContact (request, reply) {
  var viewContext = View.contextDefaults(request)
  var httpRequest = require('request')

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    request.params.orgId = process.env.licenceOrgId
    request.params.typeId= process.env.licenceTypeId

    API.licence.get(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - contact details'
      viewContext.licenceData = data.data
      reply.view('water/licences_contact', viewContext)
    })
  }
}

function getLicenceMap (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.contextDefaults(request)
  console.log(request.session)

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    request.params.orgId = process.env.licenceOrgId
    request.params.typeId= process.env.licenceTypeId

    API.licence.get(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - abstraction point'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = data
      reply.view('water/licences_map', viewContext)
    })
  }
}

function getLicenceTerms (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.contextDefaults(request)
  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    request.params.orgId = process.env.licenceOrgId
    request.params.typeId= process.env.licenceTypeId

    API.licence.get(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - Full Terms'
      viewContext.licenceData = data.data
      reply.view('water/licences_terms', viewContext)
    })
  }
}

function useShortcode(request,reply){

  console.log('got shortcode requests')





  API.user.useShortcode(request.params.shortcode,request.session.cookie,(res)=>{
    console.log('response from user shortcode')
//    console.log(response)
    console.log(res)
    var data=JSON.parse(res.data)
    console.log(data)
    if(data.error){
      var viewContext = View.contextDefaults(request)
          viewContext.pageTitle = 'GOV.UK - register licence error '+data.error

          reply.view('water/shortcode_used_error', viewContext)
    } else {
      var viewContext = View.contextDefaults(request)
      viewContext.licence_id=res.data[0].licence_id

      viewContext.pageTitle = 'GOV.UK - register licence '
          reply.view('water/shortcode_use_success', viewContext)
    }

  })


}

module.exports={
  getRoot:getRoot,
  getSignin:getSignin,
  getSignout:getSignout,
  postSignin:postSignin,
  getLicences:getLicences,
  getLicence:getLicence,
  getLicenceContact:getLicenceContact,
  getLicenceMap:getLicenceMap,
  getLicenceTerms:getLicenceTerms,
  useShortcode:useShortcode

}
