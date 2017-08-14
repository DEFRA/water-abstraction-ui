'use strict'
// See Code API ref at https://github.com/hapijs/code/blob/HEAD/API.md
require('dotenv').config()

// requires for testing
const Code = require('code')

const expect = Code.expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

// use some BDD verbage instead of lab default
const describe = lab.describe
const it = lab.it
const after = lab.after

// require hapi server
const API = require('../src/API.js')
const Helpers = require('../src/helpers.js')


var testData={};

// tests
describe('API API', () => {
  it('has methods', (done) => {
    expect(API).to.be.a.object()
    done()
  })
})

// tests
describe('API getFields', () => {
  it('getFields is an array', (done) => {
    API.field.list((data) => {
//      console.log('got data!')
//      console.log(data)
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API getOrgs', () => {
  it('getOrgs is an array', (done) => {
    API.org.list((data) => {
//      console.log('got data!')
//      console.log(data)
      testData.orgId=data[0].org_id
      testData.orgNm=data[0].org_nm
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API getOrg', () => {
  it('getOrgs is an array', (done) => {
    API.org.get(testData,(data) => {
//      console.log('got data!')
//      console.log(data)
      expect(data).to.be.a.array()
    done()
    })
  })
})


describe('API createOrg', () => {
  //TODO: create org
  it('getTypes is an array', (done) => {
    API.org.create({org_nm:'test org '+Helpers.createGUID()},(data) => {
      expect(data).to.be.a.array()
      testData.newOrgId=data[0].org_id
    done()
    })
  })
})


describe('API updateOrg', () => {
  //TODO: update org
  it('getTypes is an array', (done) => {
    API.org.update({params:{org_id:testData.newOrgId},payload:{org_nm:'test org'}},(data) => {
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API deleteOrg', () => {
  //TODO: delete org
})


describe('API getTypes', () => {
  it('getTypes is an array', (done) => {
    API.type.list(testData,(data) => {
      expect(data).to.be.a.array()
      testData.typeId=data[0].type_id
    done()
    })
  })
})


describe('API getType', () => {
  it('getType is an array', (done) => {
    API.type.get(testData,(data) => {
//      console.log(data)
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API create new type', () => {
  //TODO: update org
  it('response is an array', (done) => {
    API.type.create({params:{org_id:testData.newOrgId},payload:{type_nm:'test test'}},(data) => {
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API update type', () => {
  //TODO: update org
  it('response is an array', (done) => {
    API.type.update({},(data) => {
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API delete type', () => {
  //TODO: update org
  it('response is an array', (done) => {
    API.type.delete({},(data) => {
      expect(data).to.be.a.array()
    done()
    })
  })
})

describe('API getLicences', () => {
  it('getLicences is an array', (done) => {
    API.licence.list(testData,(data) => {
      expect(data).to.be.a.array()

      console.log(data.length+" licences returned")


      testData.licenceId=data[0].licence_id
    done()
    })
  })
})

describe('API getLicence', () => {
  it('getLicence is an array', (done) => {
    API.licence.get(testData,(data) => {
      console.log("GET LICENCE RESPONSE")
      console.log(data)
      console.log('set testData.testLicence')
      testData.testLicence=data

      expect(data).to.be.a.object()

    done()
    })
  })
})

describe('API getLicence', () => {
  it('getLicence is an array', (done) => {
    API.licence.get({},(data) => {
      console.log("GET LICENCE RESPONSE")
      console.log(data)
      expect(data).to.be.a.object()

//      console.log('returned from get licence')
//        console.log(data)


    done()
    })
  })
})

describe('API create', () => {

  it('will not create a new licence when licence id is supplied', (done) => {
    var request={payload:testData.testLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}

    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data).to.be.a.object()
      expect(data.error).to.be.a.array()


    done()
    })
  })
})

describe('API create', () => {
  it('will create a new licence', (done) => {
    console.log("create licence with licence id")
    console.log(testData.testLicence)
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data).to.be.a.string()
      expect(data.error).to.not.exist()
    done()
    })
  })
})

describe('API create', () => {
  it('will not create a new licence if licence_ref is not set', (done) => {
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    delete tmpLicence.licence_ref
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data.error).to.be.an.array()
    done()
    })
  })
})

describe('API create', () => {
  it('will not create a new licence if licence_type_id is not set', (done) => {
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    delete tmpLicence.licence_type_id
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data.error).to.be.an.array()
    done()
    })
  })
})

describe('API create', () => {
  it('will not create a new licence if licence_org_id is not set', (done) => {
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    delete tmpLicence.licence_org_id
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data.error).to.be.an.array()
    done()
    })
  })
})

describe('API create', () => {
  it('will not create a new licence if attributes.LicenceHolder is not set', (done) => {
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    delete tmpLicence.attributes.LicenceHolder
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data.error).to.be.an.array()
    done()
    })
  })
})

describe('API create', () => {
  it('will not create a new licence if unexpected parameters are set', (done) => {
    var tmpLicence=JSON.parse(JSON.stringify(testData.testLicence))
    delete tmpLicence.licence_id
    tmpLicence.attributes.additionalParameter='bob'
    var request={payload:tmpLicence,params:{orgId:testData.orgId,typeId:testData.typeId}}
    API.licence.create(request,(data) => {
//      console.log(data.attributeData);
      expect(data.error).to.be.an.array()
    done()
    })
  })
})

describe('API update', () => {
  it('update is an array', (done) => {
    API.licence.update({payload:testData.testLicence,params:{org_id:testData.newOrgId,type_id:testData.typeId}},(data) => {
//      console.log(data.attributeData);
      expect(data).to.be.a.object()
      expect(data.attributeData).to.exist()
    done()
    })
  })
})
