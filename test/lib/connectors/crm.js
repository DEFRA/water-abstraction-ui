'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
// const rewire = require('rewire');



const crm = require('../../../src/lib/connectors/crm.js')


lab.experiment('crm.getEntity', () => {
  lab.test('function exists', async () => {
    Code.expect(crm.getEntity).to.be.a.function()
  })
})

lab.experiment('crm.getLicences', () => {
  lab.test('function exists', async () => {
    Code.expect(crm.getLicences).to.be.a.function()
  })
})

lab.experiment('crm.setLicenceName', () => {
  lab.test('function exists', async () => {
    Code.expect(crm.setLicenceName).to.be.a.function()
  })
})

lab.experiment('crm.getLicenceInternalID', () => {
  lab.test('function exists', async () => {
  Code.expect(crm.getLicenceInternalID).to.be.a.function()
})
})
