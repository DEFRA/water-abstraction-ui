'use strict'
// See Code API ref at https://github.com/hapijs/code/blob/HEAD/API.md

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
const API = require('../../src/lib/API.js')


// tests
describe('API Route', () => {
  it('has methods', (done) => {
    expect(API).to.be.a.object()
    done()
  })
})

describe('getFields', () => {
  it('returns an object', (done) => {
    API.system.getFields({},{},(data)=>{
      expect(data).to.be.a.object()
    done()
    })

  })
})

describe('getOrg', () => {
  it('returns an object', (done) => {
    API.org.get({params:{orgId:1}},{},(data)=>{
      expect(data).to.be.a.object()
      done()
    })
  })
})

describe('listLicenceTypes', () => {
  it('returns an object', (done) => {
    API.licencetype.list({params:{orgId:1}},{},(data)=>{
      expect(data).to.be.a.object()
      done()

    })
  })
})

describe('getLicenceType', () => {
  it('returns an object', (done) => {
    API.licencetype.get({params:{orgId:1,typeId:1}},{},(data)=>{
      expect(data).to.be.a.object()
    done()
    })

  })
})

describe('getLicenceTypeFields', () => {
  it('returns an object', (done) => {
    API.licencetype.getFields({params:{orgId:1,typeId:1}},{},(data)=>{
      expect(data).to.be.a.object()
      done()

    })
  })
})

describe('listLicences', () => {
  it('returns an object', (done) => {
    API.licence.list({params:{orgId:1,typeId:1}},{},(data)=>{
      expect(data).to.be.a.object()
    done()
    })

  })
})

describe('getlicence', () => {
  it('returns an object', (done) => {
    API.licence.get({params:{orgId:1,typeId:1,licenceId:50}},{},(data)=>{
      expect(data).to.be.a.object()
    done()
    })

  })
})
