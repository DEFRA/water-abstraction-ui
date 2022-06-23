const Lab = require('@hapi/lab')
const lab = Lab.script()
const { expect } = require('@hapi/code')
const { parseNaldDataURI } = require('@envage/water-abstraction-helpers').digitise

lab.experiment('parseNaldDataURI', () => {
  lab.test('It should parse a valid NALD data URI', async () => {
    const uri = 'nald://conditions/2/534'
    const result = parseNaldDataURI(uri)
    expect(result).to.equal({
      entity: 'conditions',
      id: 534,
      regionId: 2
    })
  })

  lab.test('It should throw an error if the NALD data URI is invalid', async () => {
    const uri = 'oops://conditions/2/534'
    const func = () => (parseNaldDataURI(uri))
    expect(func).to.throw()
  })
})

exports.lab = lab
