'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const rewire = require('rewire');



const helpers = require('../../src/lib/helpers.js')



lab.experiment('helpers.createGUID', () => {
  lab.test('function exists', async () => {
  Code.expect(helpers.createGUID).to.be.a.function()
})
lab.test('returns a string', async () => {
Code.expect(helpers.createGUID()).to.be.a.string()
})
})

lab.experiment('helpers.makeURIRequest', () => {
  lab.test('function exists', async () => {
  Code.expect(helpers.makeURIRequest).to.be.a.function()
})
})

lab.experiment('helpers.makeURIRequestWithBody', () => {
  lab.test('function exists', async () => {
  Code.expect(helpers.makeURIRequestWithBody).to.be.a.function()
})
})
