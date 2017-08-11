const Helpers = require('../helpers')
const httpRequest = require('request')
const View = require('../view')
const Session = require('../session')


function getAdminIndex(request,reply){
  var viewContext = {}

    viewContext.pageTitle = 'GOV.UK - Admin'
      console.log('*** adminIndex ***')
  reply.view('water/admin/index', viewContext)
}

function getAdminFields(request,reply){
  var viewContext = {}
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/field', (error, response, body) => {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Admin/Fields'
    viewContext.data = JSON.parse(body)
    console.log('*** adminIndex ***')
    reply.view('water/admin/fields', viewContext)
  })

}

function getOrganisations(request,reply){
  var viewContext = {}
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/org', (error, response, body) => {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Admin/Fields'
    viewContext.data = JSON.parse(body)
    reply.view('water/admin/organisations', viewContext)
  })
}
function getOrganisationLicenceTypes(request,reply){
  var viewContext = {}
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/org/'+request.params.orgId+'/licencetype', (error, response, body) => {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Admin/Fields'
    viewContext.data = JSON.parse(body)
    viewContext.orgId=request.params.orgId
    viewContext.debug.data = JSON.parse(body)
    reply.view('water/admin/organisationLicenceTypes', viewContext)
  })
}

function getOrganisationLicenceType(request,reply){
  var viewContext = {}
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/org/'+request.params.orgId+'/licencetype/'+request.params.typeId, (error, response, body) => {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Admin/Fields'
    viewContext.data = JSON.parse(body)
    viewContext.orgId=request.params.orgId
    viewContext.typeId=request.params.typeId
    viewContext.debug.data = JSON.parse(body)
    reply.view('water/admin/organisationLicenceType', viewContext)
  })
}

module.exports = [

  { method: 'GET', path: '/admin', handler: getAdminIndex },
  { method: 'GET', path: '/admin/fields', handler: getAdminFields },
  { method: 'GET', path: '/admin/organisation', handler: getOrganisations },
  { method: 'GET', path: '/admin/organisation/{orgId}/licencetypes', handler: getOrganisationLicenceTypes },
  { method: 'GET', path: '/admin/organisation/{orgId}/licencetypes/{typeId}', handler: getOrganisationLicenceType }
]
