'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const {
  number
} = require('shared/view/nunjucks/filters/number')

experiment('number Nunjucks filter', () => {
  test('should truncate numbers to 6 dp', async () => {
    expect(number(10.12345678)).to.equal('10.123457')
  })
  test('should format thousands with commas', async () => {
    expect(number(10000)).to.equal('10,000')
  })
})
