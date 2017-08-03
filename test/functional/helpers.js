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
const Helpers = require('../../src/helpers.js')

console.log(Helpers)

// tests
describe('Test Helpers', () => {
  it('Returns a guid', (done) => {
    expect(Helpers).to.be.a.object()
    done()
  })
})

describe('Test createGUID', () => {
  it('Returns a guid', (done) => {
    var result = Helpers.createGUID()
    expect(result).to.be.a.string()
    expect(result).to.have.length(36)
    done()
  })
})
