const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const { htmlDecode } = require('shared/view/nunjucks/filters/html-decode')

experiment('htmlDecode', () => {
  test('returns text with html character entities transformed', async () => {
    const str = 'text with special characters &#39; &amp; &num;'
    expect(htmlDecode(str)).to.equal('text with special characters \' & #')
  })

  test('returns text without html character entities unchanged', async () => {
    const str = '1st line of text without special characters'
    expect(htmlDecode(str)).to.equal('1st line of text without special characters')
  })
})
