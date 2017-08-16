/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/

const API= require('../lib/API')
const version = '1.0'


module.exports = [
  { method: 'GET', path: '/API/' + version + '/field', handler: API.system.getFields },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}', handler: API.org.get },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype', handler: API.licencetype.list },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}', handler: API.licencetype.get },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/field', handler: API.licencetype.getFields },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/licence', handler: API.licence.list },
  { method: 'GET', path: '/API/' + version + '/org/{orgId}/licencetype/{typeId}/licence/{licenceId}', handler: API.licence.get }

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
