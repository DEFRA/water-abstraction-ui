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
const Public = require('../../src/routes/public.js')


// tests
describe('Public Route', () => {
  it('has methods', (done) => {
    expect(Public).to.be.a.array()
    done()
  })
})
