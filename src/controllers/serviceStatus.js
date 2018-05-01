const IDM = require('../lib/connectors/idm')
const CRM = require('../lib/connectors/crm')
const permits = require('../lib/connectors/permit')
const water = require('../lib/connectors/water')

async function serviceStatus (request, reply) {
  var errors = 0
  var html = '<html><head><body><table><tr><th>Service</th><th>Info</th></tr>'
  var data = {
    idm: {},
    crm: {},
    waterservice: {
      import: {}
    },
    permitrepo: {}
  }
  try {
    const userData = await IDM.usersClient.findMany({}, {}, {
      'perPage': 1
    })
    data.idm.users = userData.pagination.totalRows
    html += `<tr><td>IDM Users</td><td>${data.idm.users}</td></tr>`
    const idmKPI = await IDM.kpi.findMany({}, {}, {})
    idmKPI.data.forEach((d)=>{
    html += `<tr><td>&nbsp</td><td>${d.datapoint}</td><td>${d.value}</td><td>${d.description}</td></tr>`
    data.idm[d.datapoint]=d.value
    })
  } catch (e) {
    html += `<tr><td>IDM Users</td><td>ERROR</td></tr>`
    errors++
  }

  try {
    const documentData = await CRM.documents.findMany({}, {}, {
      'perPage': 1
    })
    data.crm.documents = documentData.pagination.totalRows
    html += `<tr><td>CRM Documents</td><td>${data.crm.documents}</td></tr>`
    const crmKPI = await CRM.kpi.findMany({}, {}, {})
    crmKPI.data.forEach((d)=>{
    html += `<tr><td>&nbsp</td><td>${d.datapoint}</td><td>${d.value}</td><td>${d.description}</td></tr>`
    data.crm[d.datapoint]=d.value
    })
  } catch (e) {
    console.log(e)
    html += `<tr><td>CRM Documents</td><td>ERROR</td></tr>`
    errors++
  }

  try {
    const verificationData = await CRM.verification.findMany({}, {}, {
      'perPage': 1
    })
    data.crm.verifications = verificationData.pagination.totalRows
    html += `<tr><td>CRM Verifications</td><td>${data.crm.verifications}</td></tr>`
  } catch (e) {
    html += `<tr><td>CRM Verifications</td><td>ERROR</td></tr>`
    errors++
  }

  try {
    const permitData = await permits.licences.findMany({}, {}, {
      'perPage': 1
    })
    data.permitrepo.permits = permitData.pagination.totalRows
    html += `<tr><td>Permit Repo Permits</td><td>${data.permitrepo.permits}</td></tr>`
  } catch (e) {
    html += `<tr><td>Permit Repo Permits</td><td>ERROR</td></tr>`
    errors++
  }

  data.waterservice.import = {}
  try {
    const importDataComplate = await water.pendingImport.findMany({
      'status': 1
    }, {}, {
      'perPage': 1
    })
    data.waterservice.import.complete = importDataComplate.pagination.totalRows
    html += `<tr><td>Imported Permits</td><td>${data.waterservice.import.complete}</td></tr>`
  } catch (e) {
    html += `<tr><td>Imported Permits</td><td>ERROR</td></tr>`
    errors++
  }
  try {
    const importDataPending = await water.pendingImport.findMany({
      'status': 0
    }, {}, {
      'perPage': 1
    })
    data.waterservice.import.pending = importDataPending.pagination.totalRows
    html += `<tr><td>Pending Permits</td><td>${data.waterservice.import.pending}</td></tr>`
  } catch (e) {
    html += `<tr><td>Pending Permits</td><td>ERROR</td></tr>`
    errors++
  }

  html += `<tr><td><b>Errors<b></td><td> ${errors} ERRORS REPORTED</td></tr>`
  html += '</body></html>'

  if (request.query.format && request.query.format === 'json') {
    return reply(data)
  } else {
    return reply(html)
  }
}

module.exports = {
  serviceStatus
}
