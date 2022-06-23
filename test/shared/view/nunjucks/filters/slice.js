'use strict'

const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const {
  slice
} = require('shared/view/nunjucks/filters/slice')

experiment('slice Nunjucks filter', () => {
  const str = 'The quick brown fox jumps over the lazy dog.'

  test('should slice the supplied string from the start', async () => {
    const result = slice(str, 4, 9)
    expect(result).to.equal('quick')
  })

  test('should slice the supplied string from the end', async () => {
    const result = slice(str, -4, -1)
    expect(result).to.equal('dog')
  })
})
