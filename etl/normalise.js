function createLicence(licenceRow) {
  return {
    id: licenceRow["Licence No."],
    name: licenceRow["Name"],
    addressLine1: licenceRow["Line 1"],
    addressLine2: licenceRow["Line 2"],
    addressLine3: licenceRow["Line 3"],
    addressLine4: licenceRow["Line 4"],
    town: licenceRow["Town"],
    county: licenceRow["County"],
    country: licenceRow["Country"],
    postCode: licenceRow["Postcode"],
    maxAnnualQuantity: licenceRow["Max Annual Quantity"],
    maxDailyQuantity: licenceRow["Max Daily Quantity"],
    sourceOfSupply: licenceRow["Source Type"],
    effectiveFrom: licenceRow["Orig. Effective Date"],
    effectiveTo: licenceRow["Expiry Date"] ? licenceRow["Expiry Date"] : "No expiry",
    purposes: []
  }
}

function createPurpose(licenceRow) {
  return {
    id: licenceRow["Purpose ID"],
    primaryCode: licenceRow["Primary Code"],
    secondaryCode: licenceRow["Secondary Code"],
    useCode: licenceRow["Use Code"],
    annualQuantity: licenceRow["Annual Qty"],
    dailyQuantity: licenceRow["Daily Qty"],
    hourlyQuantity: licenceRow["Hourly Qty"],
    instantQuantity: licenceRow["Inst Qty"],
    description: licenceRow["Use Description"],
    periodStart: licenceRow["Period Start"],
    periodEnd: licenceRow["Period End"],
    meansOfMeasurement: licenceRow["MoM Description"],
    points: [],
    conditions: []
  }
}

function createPoint(licenceRow) {
  return {
    id: licenceRow["Point ID"],
    name: licenceRow["Point Name"],
    ngr1: licenceRow["NGR 1"],
    ngr2: licenceRow["NGR 2"],
    ngr3: licenceRow["NGR 3"],
    ngr4: licenceRow["NGR 4"],
    meansOfAbstraction: licenceRow["MoA Description"]
  }
}

function createCondition(licenceRow) {
  return {
    code: licenceRow["Code"],
    subCode: licenceRow["Sub Code"],
    parameter1: licenceRow["1st Parameter"],
    parameter2: licenceRow["2nd Parameter"],
    text: licenceRow["Text"]
  }
}

function getById(array, id) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].id === id) {
      return array[i]
    }
  }

  return undefined
}

function normalise(licenceRows) {
  var licences = []
  var purposes = []
  var points = []

  for(var i = 0; i < licenceRows.length; i++) {
    var licenceRow = licenceRows[i]

    // Get or create licence
    var licenceId = licenceRow["Licence No."]
    var licence = getById(licences, licenceId)
    if (licence === undefined) {
      licence = createLicence(licenceRow)
      licences.push(licence);
    }

    // Get or create purpose
    var purposeId = licenceRow["Purpose ID"]
    var purpose = getById(licence.purposes, purposeId)
    if (purpose === undefined) {
      purpose = purposes[purposeId]
      if (purpose === undefined) {
        purpose = createPurpose(licenceRow)
        purposes[purposeId] = purpose
      }

      licence.purposes.push(purpose)
    }

    // Get or create point
    var pointId = licenceRow["Point ID"]
    var point = getById(purpose.points, pointId)
    if (point === undefined) {
      point = points[pointId]
      if (point === undefined) {
        point = createPoint(licenceRow)
        points[pointId] = point
      }

      purpose.points.push(point)
    }

    var condition = createCondition(licenceRow);
    purpose.conditions.push(condition)
  }

  return licences
}

module.exports = {
  normalise: normalise
}
