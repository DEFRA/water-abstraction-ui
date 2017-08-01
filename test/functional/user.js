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
const User = require('../../src/user.js')

// tests

describe('Test User js', () => {
  it('Returns an object', (done) => {

    expect(User).to.be.a.object()
    done()
  })
})

describe('Test demo login', () => {
  it('Returns true', (done) => {
    expect(User.authenticate('demouser','password').status).to.equal(true)
    done()
  })
})

describe('Test demo incorrect login', () => {
  it('Returns true', (done) => {
    expect(User.authenticate('demouser','nopassword').status).to.equal(false)
    done()
  })
})
