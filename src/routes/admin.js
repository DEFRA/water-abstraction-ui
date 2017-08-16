
const Admin= require('../lib/admin')

module.exports = [

  { method: 'GET', path: '/admin', handler: Admin.index },
  { method: 'GET', path: '/admin/fields', handler: Admin.fields },
  { method: 'GET', path: '/admin/organisation', handler: Admin.organisations },
  { method: 'GET', path: '/admin/organisation/{orgId}/licencetypes', handler: Admin.organisationLicenceTypes },
  { method: 'GET', path: '/admin/organisation/{orgId}/licencetypes/{typeId}', handler: Admin.organisationLicenceType }
]
