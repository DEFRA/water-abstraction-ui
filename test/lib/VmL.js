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
const VmL = require('../../src/lib/VmL.js')


// tests
describe('VML Library', () => {
  it('has methods', (done) => {
    expect(VmL).to.be.a.object()
    done()
  })
})
