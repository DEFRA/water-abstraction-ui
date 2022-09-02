'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { percentage } = require('shared/view/nunjucks/filters/percentage')

experiment('shared/view/nunjucks/filters/percentage', () => {
  test('returns a percentage to 2 decimal places', () => {
    expect(percentage(10, 100)).to.equal('10.00%')
  })

  test('a third parameter can be supplied to set the number of decimal places', () => {
    expect(percentage(10, 100, 3)).to.equal('10.000%')
  })

  test('returns null if the denominator is undefined', () => {
    expect(percentage(10, 0)).to.equal(null)
  })
})
