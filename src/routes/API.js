/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/
const API = require('../API')

const version = '1.0'

function systemFieldsGetHandler (request, reply) {
// list all orgs
  API.field.list((data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function orgsGetHandler (request, reply) {
// list all orgs
  API.org.list((data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function orgsPostHandler (request, reply) {
  // create new org
  API.org.create(request.payload, (data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function orgGetHandler (request, reply) {
// return specified org
  API.org.get(request.params, (data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function orgPutHandler (request, reply) {
// update specified org
  API.org.update(request,(data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function orgDeleteHandler (request, reply) {
  // delete specified org]
  reply('org delete not in place')
}

function typesGetHandler (request, reply) {
// return all licence types for org
  API.type.list(request.params, (data) => {
    console.log('got data!')
//    console.log(data)
    reply(data)
  })
}

function typesPostHandler (request, reply) {
// return all licence types for org
  API.type.create(request, (data) => {
    console.log('got data!')
//    console.log(data)
    reply(data)
  })
}

function typeGetHandler (request, reply) {
  // return specific licence type definition for org
  API.type.get(request.params, (data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function licenceFieldsGetHandler (request, reply) {
// list all orgs
  console.log(request.params)
  API.licencefield.list(request,(data) => {
    console.log('got data!')
//    console.log(data)
    reply(data)
  })
}

function licencesGetHandler (request, reply) {
// return licence summaries for org & type
  API.licence.list(request.params, (data) => {
    console.log('got data!')
//    console.log(data)
    reply(data)
  })
}

function licencesPostHandler (request, reply) {
// create new licence for org & type
  API.licence.create(request, (data) => {
    reply(data)
  })
}

function licenceGetHandler (request, reply) {
// return specific licence for org & type
  API.licence.get(request.params, (data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function licencePutHandler (request, reply) {
// update specific licence for org & type
  API.licence.update(request.params, (data) => {
    console.log('got data!')
    console.log(data)
    reply(data)
  })
}

function test (request, reply) {
  // generic test function
  // TODO: remove this function

}

function reset (request, reply) {
  // reset all test data
  var data = {}
  var update = Api.reset((data) => {
    reply(data)
  })
}

module.exports = [
  { method: 'GET', path: '/API/' + version + '/field', handler: systemFieldsGetHandler },
  { method: 'GET', path: '/API/' + version + '/org', handler: orgsGetHandler },
  { method: 'POST', path: '/API/' + version + '/org', handler: orgsPostHandler },
  { method: 'DELETE', path: '/API/' + version + '/org/{orgId}', handler: orgDeleteHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}', handler: orgGetHandler },
  { method: 'PUT', path: '/API/' + version + '/org/{orgId}', handler: orgPutHandler },
  { method: 'POST', path: '/API/' + version + '/org/{orgId}/licencetype', handler: typesPostHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype', handler: typesGetHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}', handler: typeGetHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/field', handler: licenceFieldsGetHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/licence', handler: licencesGetHandler },
  { method: 'POST', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/licence', handler: licencesPostHandler },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/licence/{licenceId}', handler: licenceGetHandler },
{ method: 'GET', path: '/API/' + version + '/reset', handler: reset },

{ method: 'GET', path: '/API/' + version + '/test', handler: test }
]
/**
{ method: 'GET', path: '/API/' + version + '/test', handler: test },
{ method: 'POST', path: '/API/' + version + '/licences', handler: licencesPostHandler },
{ method: 'GET', path: '/API/' + version + '/licences/{id}', handler: licenceGetHandler },
{ method: 'PUT', path: '/API/' + version + '/licences/{id}', handler: licencePutHandler  }

{ method: 'GET', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/licences', handler: getLicencesByOrgandType },
{ method: 'GET', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/licences/{licenceId}', handler: getLicenceByOrgTypeID },
{ method: 'POST', path: '/API/' + version + '/orgs/{orgId}/types/{typeId}/licences', handler: addLicenceByOrgTypeID },

**/
