const fs = require('fs')
const baseFilePath=__dirname+'/../public/data/licences/'
const helpers = require('./helpers')


function getLicences () {
  var alllicences = []
  fs.readdirSync(baseFilePath).forEach(function (file) {
    if (file.indexOf('.json') > -1) {
      var licenceInfo = getLicenceSummary(file)
      if (licenceInfo) {
        licenceInfo.key = file.split('.')[0]
        alllicences.push(licenceInfo)
      }
    }
  })
  return alllicences
}

function getLicence (ref) {
  const thisFile = baseFilePath + ref
  console.info('read ' + thisFile)

  var licenceObject = JSON.parse(fs.readFileSync(thisFile).toString());
  return licenceObject
}

function updateLicence (id, data) {
  const thisFile = baseFilePath + id + '.json'
  if (fs.existsSync(thisFile)) {
    fs.writeFileSync(thisFile, JSON.stringify(data))
    return id
  } else {
    console.log('404!')
    throw 'licence not found'
  }
}

function createLicence (data) {
  const id = helpers.createGUID()
  const thisFile = baseFilePath + id + '.json'
  console.log(thisFile)
  if (!fs.existsSync(thisFile)) {
    fs.writeFileSync(thisFile, JSON.stringify(data))
    return id
  } else {
    console.log('404!')
    throw 'licence exists'
  }
}

function getLicenceSummary (filename) {
  var fileInfo = {}
  try {
    const licenceObject = getLicence(filename)

    if (!licenceObject.LicenceSerialNo) {
      fileInfo.LicenceSerialNo = filename
      fileInfo.LicenceName = 'invalid licence'
    } else {
      fileInfo.LicenceSerialNo = licenceObject.LicenceSerialNo
      fileInfo.LicenceName = licenceObject.LicenceName
    }

    console.log(fileInfo)
    return fileInfo
  } catch (e) {
    console.log(e)
    fileInfo.LicenceSerialNo = filename
    fileInfo.LicenceName = e
    return fileInfo
  }
}


module.exports={
list:getLicences,
get:getLicence,
update:updateLicence,
create:createLicence,
summary:getLicenceSummary
}
