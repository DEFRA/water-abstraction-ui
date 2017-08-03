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
const Server = require('../../index.js')

// tests
describe('Functional Tests - Server', () => {
  it('should be a HAPI server', (done) => {
    expect(Server).to.exist()
    expect(Server).to.be.a.object()
    expect(Server.connection).to.exist()
    done()
  })

  after((done) => {
    done()
  })
})

describe('Functional Tests - Required plugins', () => {
  it('should be a HAPI server', (done) => {
    expect(Server.registrations).to.be.an.object()
    expect(Server.registrations['hapi-server-session']).to.be.an.object()
    expect(Server.registrations['inert']).to.be.an.object()
    expect(Server.registrations['vision']).to.be.an.object()
    done()
  })
  after((done) => {
    done()
  })
})
