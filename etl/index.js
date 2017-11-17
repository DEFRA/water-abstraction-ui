require('dotenv').config()

var xlsx = require('XLSX')
var anonymise = require('./anonymise')
var normalise = require('./normalise')
var exportLicence = require('./export')

function loadWorkbook(workbookName) {
  return workbook = xlsx.readFile(workbookName)
}

function loadData (workbook) {
  var firstSheetName = workbook.SheetNames[0]
  return xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName])
}

function writeWorkbook(workbook, data) {
  var firstSheetName = workbook.SheetNames[0]
  workbook.Sheets[firstSheetName] = xlsx.utils.json_to_sheet(data)
  xlsx.writeFile(workbook, 'out.xlsx')
}

if (process.argv.length != 5) {
  console.log("Correct format for running ETL tool is:")
  console.log("")
  console.log("    node index.js <input.xls> <Org ID> <Licence Type ID>")
  process.exit(1)
}

var workbookName = process.argv[2]
var orgId = process.argv[3]
var licenceTypeId = process.argv[4]

var workbook = loadWorkbook(workbookName)
var data = loadData(workbook)
//data = anonymise.anonymiseData(data)
//writeWorkbook(workbook, data)

data = normalise.normalise(data)
for(var i = 0; i < data.length; i++) {
  exportLicence.exportLicence(data[i], orgId, licenceTypeId)
}
