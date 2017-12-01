'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
// const rewire = require('rewire');



const permit = require('../../../src/lib/connectors/permit.js')



lab.experiment('permit.getLicence', () => {
  lab.test('function exists', async () => {
  Code.expect(permit.getLicence).to.be.a.function()
})
})
