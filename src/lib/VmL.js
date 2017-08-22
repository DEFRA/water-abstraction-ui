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

function getSignin (request, reply) {
  //get signin page
  if(request.path != '/signin'){
    request.yar.set('postlogin',request.path)
  } else {
    request.yar.set('postlogin','/licences')
  }
  Session.set(request, {id: Helpers.createGUID()})
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  reply.view('water/signin', viewContext)
}

function postSignin (request, reply) {
  //post from signin page
  if (request.payload && request.payload.user_id && request.payload.password) {
    var getUser = User.authenticate(request.payload.user_id, request.payload.password)
    if (getUser.status) {
      var session = Session.get(request)
      session.user = getUser.user
      Session.set(request, session)
      reply('<script>location.href=\''+request.yar.get('postlogin')+'\'</script>')
    } else {
      var viewContext = View.contextDefaults(request)
      viewContext.payload = request.payload
      viewContext.errors = {}
      viewContext.errors['authentication'] = 1
      viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
      reply.view('water/signin', viewContext)
    }
  } else {
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
  var httpRequest = require('request')
  var user = viewContext.session.user
  if (!user) {
    getSignin(request, reply)
  } else {
    //TODO: save params for session
    request.params.orgId=1;
    request.params.typeId=1;
    API.licence.list(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.licenceData = data
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
      reply.view('water/licences', viewContext)
    })
  }
}

function getLicence (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.contextDefaults(request)
  console.log(request.session)

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    //TODO: save params for session
    request.params.orgId=1;
    request.params.typeId=1;
    API.licence.get(request,reply,(data)=>{
      console.log('got licence')
      var viewContext = View.contextDefaults(request)
      console.log(JSON.stringify(data))
      viewContext.licenceData = data.data
      viewContext.debug.licenceData = viewContext.licenceData
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
      reply.view('water/licence', viewContext)
    })
  }
}

function getLicenceContact (request, reply) {
  var viewContext = View.contextDefaults(request)
  var httpRequest = require('request')

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    //TODO: save params for session
    request.params.orgId=1;
    request.params.typeId=1;
    API.licence.get(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - contact details'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = data
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
    //TODO: save params for session
    request.params.orgId=1;
    request.params.typeId=1;
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
    //TODO: save params for session
    request.params.orgId=1;
    request.params.typeId=1;
    API.licence.get(request,reply,(data)=>{
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - Full Terms'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = data
      reply.view('water/licences_terms', viewContext)
    })
  }
}



module.exports={
  getRoot:getRoot,
  getSignin:getSignin,
  postSignin:postSignin,
  getLicences:getLicences,
  getLicence:getLicence,
  getLicenceContact:getLicenceContact,
  getLicenceMap:getLicenceMap,
  getLicenceTerms:getLicenceTerms

}
