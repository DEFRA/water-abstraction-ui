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
const Licences = require('../../src/licences.js')

// tests
var newLicence
describe('Test Licences API Create', () => {
  it('Returns an object', (done) => {
    newLicence = Licences.create({'test': 'licence'})
    expect(newLicence).to.be.a.string()
    done()
  })
})
describe('Test Licences API Update', () => {
  it('Update Returns an object', (done) => {
    newLicence = Licences.update(newLicence, {test: 'licence2',  LicenceSerialNo: 'XX/XX/XX/XXXX', LicenceName: 'Test Licence'})
    expect(newLicence).to.be.a.string()
    done()
  })

  it('Update returns an error when licence does not exist]', (done) => {
    var bad = Licences.update(0, {'test': 'licence2'})
    expect(bad).to.be.a.object()
    expect(bad.error).to.be.a.string()
    done()
  })
})
describe('Test Licences API GET', () => {
  it('List licences returns an array', (done) => {
    var result = Licences.list()
    expect(result).to.be.a.array()
    done()
  })
})
describe('Test Licence API GET', () => {
  it('Get licence returns an object', (done) => {
    var result = Licences.get(newLicence + '.json')
    expect(result).to.be.a.object()
    done()
  })

  it('Licence summary returns an object', (done) => {
    var result = Licences.summary(newLicence + '.json')
    expect(result).to.be.a.object()
    done()
  })
})
describe('Test Licence API DELETE', () => {
  it('Licence delete works', (done) => {
    var result = Licences.delete(newLicence + '.json')
    expect(result).to.be.a.string()
    expect(result).to.be.equal('OK')
    done()
  })
})
