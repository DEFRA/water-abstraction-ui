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
const Server = require('../index.js')




// tests
describe('VML getRoot', () => {
  it('has methods', (done) => {
    expect(Server).to.be.an.object()

    done();
  })

  after((done) => {
        // placeholder to do something post tests
    done()
  })
})

describe('test error handler', () => {
  it('returns an error', (done) => {
    expect(Server.errorHandler()).to.be.an.object()

    done();
  })

  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
