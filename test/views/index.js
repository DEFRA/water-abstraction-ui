'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const rewire = require('rewire');



const views = require('../../src/views/index.js')



lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.engines).to.be.a.object()
})
})

lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.relativeTo).to.be.a.string()
})
})

lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.layoutPath).to.be.a.string()
})
})


lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.layout).to.be.a.string()
})
})

lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.partialsPath).to.be.a.string()
})
})

lab.experiment('Page does not exist', () => {
  lab.test('a test', async () => {
  Code.expect(views.context).to.be.a.object()
})
})
