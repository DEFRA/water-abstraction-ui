const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const { markdown } = require('shared/view/nunjucks/filters/markdown')

experiment('markdown', () => {
  test('converts the markdown to the expected html markup', async () => {
    const markdownText = '# testing'
    const htmlOutput = markdown(markdownText)
    expect(htmlOutput).to.equal('<h1>testing</h1>\n')
  })

  test('replaces ^ with > due to notify markdown syntax', async () => {
    const markdownText = '^ testing'
    const htmlOutput = markdown(markdownText)
    expect(htmlOutput).to.equal('<blockquote>\n<p>testing</p>\n</blockquote>\n')
  })
})
