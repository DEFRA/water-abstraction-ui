
var randomInitials = [
  'J R',
  'D',
  'A J',
  'A B C'
]

var randomForenames = [
  'Ed',
  'Andrew',
  'Russell',
  'Dave',
  'Ash',
  'Clare',
  'Mark',
  'David',
  'Nick',
  'Christina',
  'Andy'
]

var randomSurnames = [
  'Edwards',
  'Andrews',
  'Rouselle',
  'Davis',
  'Ashley',
  'Claire',
  'Marks',
  'Davids',
  'Nicks',
  'Christopolous',
  'Anderton'
]

var randomCompanyNames = [
  'Water abstraction limited',
  'Bavarian water ltd',
  'Mr McGregor\'s Cabbage patch'
]

var randomPointNames = [
  'Point A',
  'Point B',
  'Point C',
  'Point D',
  'Point E',
  'Point F',
  'Point G',
  'Point H',
  'Point I',
  'Point J'
]

var randomAddresses = [
  {
    addressLine1: '22 High Street',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    town: 'Bristol',
    county: '',
    postCode: 'BS1 4AB'
  },
  {
    addressLine1: 'Happydale',
    addressLine2: 'Village Road',
    addressLine3: 'Highbridge',
    addressLine4: 'Stonyford',
    town: 'Upton',
    county: 'Funnyshire',
    postCode: 'F4 1LS'
  }
]

function getRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function getRandomNgr() {
  var min = 1000000000;
  var max = 10000000000;
  // Force the random number to be 10 digits
  return 'NT' + Math.floor(Math.random() * (max - min) + min);
}

function getPersonalData() {
  return {
    initials: getRandom(randomInitials),
    forename: getRandom(randomForenames),
    surname: getRandom(randomSurnames),
    companyName: getRandom(randomCompanyNames),
    address: getRandom(randomAddresses)
  }
}

function getLocationData() {
  return {
    ngr1: getRandomNgr(),
    ngr2: getRandomNgr(),
    ngr3: getRandomNgr(),
    ngr4: getRandomNgr(),
    name: getRandom(randomPointNames)
  }
}

function anonymiseLicense(license, personalData, locationData) {
  if (license.initials) {
    license.initials = personalData.initials
  }

  if (license.Forename) {
    license.Forename = personalData.forename
    license.Name = personalData.surname
  } else {
    license.Name = personalData.companyName
  }

  address = personalData.address;
  license.Address = address.addressLine1 + ', '
                  + address.addressLine2 + ', '
                  + address.addressLine3 + ', '
                  + address.addressLine4 + ', '
                  + address.town + ', '
                  + address.county + ', '
                  + address.postCode

  license['Line 1'] = address.addressLine1;
  license['Line 2'] = address.addressLine2;
  license['Line 3'] = address.addressLine3;
  license['Line 4'] = address.addressLine4;
  license.Town = address.town;
  license.County = address.county;
  license.Postcode = address.postCode;

  if (license['NGR 1']) license['NGR 1'] = locationData.ngr1
  if (license['NGR 2']) license['NGR 2'] = locationData.ngr2
  if (license['NGR 3']) license['NGR 3'] = locationData.ngr3
  if (license['NGR 4']) license['NGR 4'] = locationData.ngr4

  license["Point Name"] = locationData.name

  return license
}

function anonymiseData(data) {
  var currentLicenseId = null
  var points = []
  for(var i = 0; i < data.length; i++) {
    var license = data[i]
    if(license['Licence No.'] !== currentLicenseId) {
      currentLicenseId = license['Licence No.']
      var personalData = getPersonalData();
    }

    points[license['Point ID']] = points[license['Point ID']] ? points[license['Point ID']] : getLocationData()
    var locationData = points[license['Point ID']]

    data[i] = anonymiseLicense(data[i], personalData, locationData)
  }
  return data
}

module.exports = {
  anonymiseData: anonymiseData
}
