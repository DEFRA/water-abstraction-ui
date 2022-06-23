'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { date } = require('shared/view/nunjucks/filters/date')

experiment('date Nunjucks filter', () => {
  test('The default date format should be the GDS standard', async () => {
    const result = date('2018-12-14')
    expect(result).to.equal('14 December 2018')
  })

  test('It should be possible to set a different date format', async () => {
    const result = date('2018-12-14', 'YY MM DD')
    expect(result).to.equal('18 12 14')
  })

  test('It should accept a timestamp in ms', async () => {
    const result = date(1544779408000)
    expect(result).to.equal('14 December 2018')
  })

  test('It should return undefined if an invalid date is supplied', async () => {
    const result = date('Some nonsense in here')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if an invalid date is supplied', async () => {
    const result = date('2020-13-01')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if an empty string is supplied', async () => {
    const result = date('')
    expect(result).to.equal(undefined)
  })

  test('It should return undefined if null is supplied', async () => {
    const result = date(null)
    expect(result).to.equal(undefined)
  })
})
