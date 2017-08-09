const fs = require('fs')
const baseFilePath = __dirname + '/../public/data/licences/'
const Helpers = require('./helpers')

function getLicences (cb) {
  var alllicences = []

  const { Client } = require('pg')
  const client = new Client()

  client.connect()

  client.query('SELECT * from licence', [], (err, res) => {
    console.log(err ? err.stack : res.rows[0]) // Hello World!
    client.end()
    console.log('return data')
    console.log(res.rows)
    cb(res.rows)
  })

/**
  fs.readdirSync(baseFilePath).forEach(function (file) {
    if (file.indexOf('.json') > -1) {
      var licenceInfo = getLicenceSummary(file)
      if (licenceInfo){
        licenceInfo.key = file.split('.')[0]
        alllicences.push(licenceInfo)
      }
    }
  })
  return alllicences
  **/
}

function getLicence (ref) {
  const thisFile = baseFilePath + ref

  var licenceObject = JSON.parse(fs.readFileSync(thisFile).toString())
  return licenceObject
}

function updateLicence (id, data) {
  //TODO: Post licence data in friendly format and transform to queries
  // TLDR: use licence id to get licence org & type, then build empty structure then iterate friendly data into it...

  const thisFile = baseFilePath + id + '.json'
  if (fs.existsSync(thisFile)) {
    fs.writeFileSync(thisFile, JSON.stringify(data))
    return id
  } else {
    return {'error': 'licence not found'}
  }
}

function createLicence (data) {
  //TODO: Post new licence handler
  const id = Helpers.createGUID()
  const thisFile = baseFilePath + id + '.json'
  fs.writeFileSync(thisFile, JSON.stringify(data))
  return id
}

function deleteLicence (id) {
  //TODO: delete status
  const thisFile = baseFilePath + id
  fs.unlinkSync(thisFile)
  return 'OK'
}

function getLicenceSummary (filename) {
  //todo: licence summary functions...
  var fileInfo = {}
  const licenceObject = getLicence(filename)

  if (!licenceObject.LicenceSerialNo) {
    fileInfo.LicenceSerialNo = filename
    fileInfo.LicenceName = 'invalid licence'
    return null
  } else {
    fileInfo.LicenceSerialNo = licenceObject.LicenceSerialNo
    fileInfo.LicenceName = licenceObject.LicenceName
    return fileInfo
  }
}

function getLicenceByOrgTypeID (data, cb) {
  const { Client } = require('pg')
  const client = new Client()
  console.log(data)
  client.connect()
  var queryParams = [data.orgId, data.typeId, data.licenceId]
  //swanky query to get the licence data
  var query = `select * from (
	SELECT licence_id,array_to_json(array_agg(attributes)) as attributeData
	from
		(
		select
		licence_id,field_nm, licence_data_value,ld.type_fields_id,tf.field_id
		from licence_data ld
		inner join type_fields tf on ld.type_fields_id = tf.type_fields_id
		inner join field f on tf.field_id = f.field_id
        ) attributes
	group by licence_id
) a,
licence l
where a.licence_id=l.licence_id and l.licence_id=$3 and l.licence_org_id=$1 and l.licence_type_id=$2`
  console.log('perform query')


  client.query(query, queryParams, (err, res) => {
    if (err) {
      console.log(err ? err.stack : 'No query errors')
    }

    client.end()

/**
convert licence data to nice friendly format, separating core values (common to all licences regardless of type) and licence/org type specific attributes
**/
    var licenceData = {}
    licenceData.licence_id = res.rows[0].licence_id
    licenceData.licence_ref = res.rows[0].licence_ref[0]
    licenceData.licence_start_dt = res.rows[0].licence_start_dt
    licenceData.licence_end_dt = res.rows[0].licence_end_dt
    licenceData.licence_status_id = res.rows[0].licence_status_id
    licenceData.licence_type_id = res.rows[0].licence_type_id
    licenceData.licence_org_id = res.rows[0].licence_org_id
    licenceData.attributes = []
    for (attribute in res.rows[0].attributedata) {
      var newAttribute = {}
      newAttribute.name = res.rows[0].attributedata[attribute].field_nm
      newAttribute.value = res.rows[0].attributedata[attribute].licence_data_value
      licenceData.attributes.push(newAttribute)
    }

    console.log(licenceData)
    cb(licenceData)
  })
}

module.exports = {
  list: getLicences,
  get: getLicence,
  update: updateLicence,
  create: createLicence,
  summary: getLicenceSummary,
  delete: deleteLicence,
  getLicenceByOrgTypeID: getLicenceByOrgTypeID

}
