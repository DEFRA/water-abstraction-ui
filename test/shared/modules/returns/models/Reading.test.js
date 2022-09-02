const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const Reading = require('shared/modules/returns/models/Reading')
const {
  METHOD_VOLUMES, METHOD_ONE_METER,
  READING_TYPE_MEASURED, READING_TYPE_ESTIMATED
} = require('shared/modules/returns/models/Reading')

const createReading = () => ({
  type: 'measured',
  method: 'oneMeter',
  units: 'l',
  totalFlag: true,
  total: 1234,
  totalCustomDates: true,
  totalCustomDateStart: '2019-04-01',
  totalCustomDateEnd: '2019-04-31'
})

experiment('Reading', () => {
  const keys = ['type', 'method', 'units', 'totalFlag',
    'total', 'totalCustomDates', 'totalCustomDateStart', 'totalCustomDateEnd']

  experiment('constructor', () => {
    for (const key of keys) {
      test(`Sets ${key} from supplied object data`, async () => {
        const data = createReading()
        const reading = new Reading(data)
        expect(reading[key]).to.equal(data[key])
      })
    }
  })

  experiment('toObject', () => {
    test('returns object data', async () => {
      const data = createReading()
      const reading = new Reading(data)
      const result = reading.toObject()
      expect(result).to.be.an.object()
      expect(result).to.include(keys)
    })

    test('omits single total data when total flag is false', async () => {
      const data = {
        ...createReading(),
        totalFlag: false
      }
      const reading = new Reading(data)
      const result = reading.toObject()
      expect(result).to.be.an.object()
      expect(result).to.only.include(['type', 'method', 'units', 'totalFlag'])
    })

    test('omits custom dates when totalCustomDates flag is false', async () => {
      const data = {
        ...createReading(),
        totalCustomDates: false
      }
      const reading = new Reading(data)
      const result = reading.toObject()
      expect(result).to.be.an.object()
      expect(result).to.only.include(['type', 'method', 'units', 'totalFlag', 'total', 'totalCustomDates'])
    })
  })

  experiment('setReadingType', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true })
    })

    test('sets type to measured and clears total flag', async () => {
      const result = reading.setReadingType(READING_TYPE_MEASURED).toObject()
      expect(result.type).to.equal(READING_TYPE_MEASURED)
      expect(result.totalFlag).to.equal(false)
    })

    test('sets type to estimated and clears total flag', async () => {
      const result = reading.setReadingType(READING_TYPE_ESTIMATED).toObject()
      expect(result.type).to.equal(READING_TYPE_ESTIMATED)
      expect(result.totalFlag).to.equal(false)
    })

    test('throws error for unknown reading type', async () => {
      const func = () => reading.setReadingType('invalid-type')
      expect(func).to.throw()
    })
  })

  experiment('setMethod', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true })
    })

    test('sets method to volumes, total flag is unchanged', async () => {
      const result = reading.setMethod(METHOD_VOLUMES).toObject()
      expect(result.method).to.equal(METHOD_VOLUMES)
      expect(result.totalFlag).to.equal(true)
    })

    test('sets method to estimates and clears total flag', async () => {
      const result = reading.setMethod(METHOD_ONE_METER).toObject()
      expect(result.method).to.equal(METHOD_ONE_METER)
      expect(result.totalFlag).to.equal(false)
    })

    test('throws error for unknown reading method', async () => {
      const func = () => reading.setMethod('invalid-type')
      expect(func).to.throw()
    })
  })

  experiment('setUnits', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true })
    })

    test('sets units to m³', async () => {
      const result = reading.setUnits('m³').toObject()
      expect(result.units).to.equal('m³')
    })

    test('sets units to l', async () => {
      const result = reading.setUnits('l').toObject()
      expect(result.units).to.equal('l')
    })

    test('sets units to Ml', async () => {
      const result = reading.setUnits('Ml').toObject()
      expect(result.units).to.equal('Ml')
    })

    test('sets units to gal', async () => {
      const result = reading.setUnits('gal').toObject()
      expect(result.units).to.equal('gal')
    })

    test('throws error for unknown unit', async () => {
      const func = () => reading.setUnits('invalid-unit')
      expect(func).to.throw()
    })
  })

  experiment('setCustomAbstractionPeriod', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true })
    })

    test('sets custom abstraction period', async () => {
      reading.setCustomAbstractionPeriod(true, '2018-02-14', '2018-12-25')
      expect(reading.totalCustomDates).to.equal(true)
      expect(reading.totalCustomDateStart).to.equal('2018-02-14')
      expect(reading.totalCustomDateEnd).to.equal('2018-12-25')
    })

    test('clears custom abstraction period', async () => {
      reading.totalCustomDates = true
      reading.totalCustomDateStart = '2018-01-01'
      reading.totalCustomDateEnd = '2018-12-25'
      reading.setCustomAbstractionPeriod(false)
      expect(reading.totalCustomDates).to.equal(false)
      expect(reading.totalCustomDateStart).to.equal(null)
      expect(reading.totalCustomDateEnd).to.equal(null)
    })

    test('throws error if flag is not boolean', async () => {
      const func = () => reading.setCustomAbstractionPeriod('x', '2018-02-14', '2018-12-25')
      expect(func).to.throw()
    })

    test('throws error if start date is not valid', async () => {
      const func = () => reading.setCustomAbstractionPeriod(true, 'x', '2018-12-25')
      expect(func).to.throw()
    })

    test('throws error if end date is not valid', async () => {
      const func = () => reading.setCustomAbstractionPeriod(true, '2019-04-01', 'x')
      expect(func).to.throw()
    })
  })

  experiment('setSingleTotal', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true })
    })

    test('sets a single total', async () => {
      reading.setSingleTotal(true, 123)
      expect(reading.totalFlag).to.equal(true)
      expect(reading.total).to.equal(123)
    })

    test('clears a single total', async () => {
      reading.totalFlag = true
      reading.total = 123
      reading.setSingleTotal(false)
      expect(reading.totalFlag).to.equal(false)
      expect(reading.total).to.equal(null)
    })

    test('throws error if flag is not boolean', async () => {
      const func = () => reading.setSingleTotal('x')
      expect(func).to.throw()
    })

    test('throws error if total is not number', async () => {
      const func = () => reading.setSingleTotal(true, 'x')
      expect(func).to.throw()
    })

    test('throws error if total is negative', async () => {
      const func = () => reading.setSingleTotal(true, -5)
      expect(func).to.throw()
    })
  })

  experiment('getSingleTotal', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ totalFlag: true, total: 123 })
    })

    test('gets single total value', async () => {
      const result = reading.getSingleTotal()
      expect(result).to.equal(123)
    })

    test('returns null if flag is false', async () => {
      reading.totalFlag = false
      const result = reading.getSingleTotal()
      expect(result).to.equal(null)
    })
  })

  experiment('getUnits', () => {
    let reading

    beforeEach(async () => {
      reading = new Reading({ units: 'Ml' })
    })

    test('gets the units', async () => {
      expect(reading.getUnits()).to.equal('Ml')
    })
  })

  experiment('isVolumes', () => {
    test('returns true when method is volumes', async () => {
      const reading = new Reading({ method: METHOD_VOLUMES })
      expect(reading.isVolumes()).to.equal(true)
    })

    test('returns fale when method is not volumes', async () => {
      const reading = new Reading({ method: METHOD_ONE_METER })
      expect(reading.isVolumes()).to.equal(false)
    })
  })

  experiment('isOneMeter', () => {
    test('returns true when method is oneMeter', async () => {
      const reading = new Reading({ method: METHOD_ONE_METER })
      expect(reading.isOneMeter()).to.equal(true)
    })

    test('returns fale when method is not volumes', async () => {
      const reading = new Reading({ method: METHOD_VOLUMES })
      expect(reading.isOneMeter()).to.equal(false)
    })
  })

  experiment('isSingleTotal', () => {
    test('returns true when total flag is set', async () => {
      const reading = new Reading({ totalFlag: true })
      expect(reading.isSingleTotal()).to.equal(true)
    })

    test('returns fale when method is not volumes', async () => {
      const reading = new Reading({ totalFlag: false })
      expect(reading.isSingleTotal()).to.equal(false)
    })
  })

  experiment('isMeasured', () => {
    test('returns true when reading type measured', async () => {
      const reading = new Reading({ type: READING_TYPE_MEASURED })
      expect(reading.isMeasured()).to.equal(true)
    })

    test('returns false when method is not volumes', async () => {
      const reading = new Reading({ type: READING_TYPE_ESTIMATED })
      expect(reading.isMeasured()).to.equal(false)
    })
  })
})
