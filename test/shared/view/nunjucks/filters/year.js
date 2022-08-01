'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { year } = require('shared/view/nunjucks/filters/year')

experiment('year Nunjucks filter', () => {
  test('The default date format should be YYYY', async () => {
    const result = year('2018-12-14')
    expect(result).to.equal('2018')
  })

  test('It should accept a timestamp in ms', async () => {
    const result = year(1544779408000)
    expect(result).to.equal('2018')
  })

  test('It should return undefined if an invalid date is supplied', async () => {
    const result = year('Some nonsense in here')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if an invalid date is supplied', async () => {
    const result = year('2020-13-01')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if an empty string is supplied', async () => {
    const result = year('')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if null is supplied', async () => {
    const result = year(null)
    expect(result).to.equal(undefined)
  })
})
