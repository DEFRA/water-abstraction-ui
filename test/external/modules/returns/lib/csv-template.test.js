'use strict'

const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')
const { experiment, test, afterEach, beforeEach, fail } = exports.lab = Lab.script()
const sandbox = require('sinon').createSandbox()

const helpers = require('@envage/water-abstraction-helpers')

const archiver = require('archiver')
const { logger } = require('external/logger')
const csvTemplates = require('external/modules/returns/lib/csv-templates')

experiment('csv templates', () => {
  let archive

  beforeEach(async () => {
    // We create an instance of `archive` so it can be piped through a passthrough stream, which would be awkward to do
    // if we simply created a mock object.
    archive = archiver('zip')
    archive.append = sandbox.stub()
    archive.finalize = sandbox.stub()

    sandbox.stub(logger, 'warn')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getCSVLineLabel', () => {
    test('should return a daily label', async () => {
      const label = csvTemplates._getCSVLineLabel({ startDate: '2019-05-02', endDate: '2019-05-02', timePeriod: 'day' })
      expect(label).to.equal('2 May 2019')
    })

    test('should return a weekly label', async () => {
      const label = csvTemplates._getCSVLineLabel({ startDate: '2019-05-05', endDate: '2019-05-11', timePeriod: 'week' })
      expect(label).to.equal('Week ending 11 May 2019')
    })

    test('should return a monthly label', async () => {
      const label = csvTemplates._getCSVLineLabel({ startDate: '2019-04-01', endDate: '2019-04-30', timePeriod: 'month' })
      expect(label).to.equal('April 2019')
    })
  })

  experiment('getCurrentCycle', () => {
    test('should return the current return cycle', async () => {
      const cycle = csvTemplates._getCurrentCycle('2019-04-01')
      expect(cycle).to.equal({
        dueDate: '2019-04-28',
        startDate: '2018-04-01',
        endDate: '2019-03-31',
        isSummer: false
      })
    })
  })

  experiment('initialiseCSV', () => {
    test('should initialise a daily CSV 2D array', async () => {
      const daily = csvTemplates._initialiseCSV('day', '2019-04-01')
      expect(daily[0][0]).to.equal('Licence number')
      expect(daily[1][0]).to.equal('Return reference')
      expect(daily[2][0]).to.equal('Site description')
      expect(daily[3][0]).to.equal('Purpose')
      expect(daily[4][0]).to.equal('Nil return Y/N')
      expect(daily[5][0]).to.equal('Did you use a meter Y/N')
      expect(daily[6][0]).to.equal('Meter make')
      expect(daily[7][0]).to.equal('Meter serial number')
      expect(daily[8][0]).to.equal('1 April 2018')
      expect(daily[372][0]).to.equal('31 March 2019')
      expect(daily[373][0]).to.equal('Unique return reference')
    })

    test('should initialise a weekly CSV 2D array', async () => {
      const weekly = csvTemplates._initialiseCSV('week', '2019-04-01')
      expect(weekly[0][0]).to.equal('Licence number')
      expect(weekly[1][0]).to.equal('Return reference')
      expect(weekly[2][0]).to.equal('Site description')
      expect(weekly[3][0]).to.equal('Purpose')
      expect(weekly[4][0]).to.equal('Nil return Y/N')
      expect(weekly[5][0]).to.equal('Did you use a meter Y/N')
      expect(weekly[6][0]).to.equal('Meter make')
      expect(weekly[7][0]).to.equal('Meter serial number')
      expect(weekly[8][0]).to.equal('Week ending 7 April 2018')
      expect(weekly[59][0]).to.equal('Week ending 30 March 2019')
      expect(weekly[60][0]).to.equal('Unique return reference')
    })

    test('should initialise a monthly CSV 2D array', async () => {
      const monthly = csvTemplates._initialiseCSV('month', '2019-04-01')
      expect(monthly[0][0]).to.equal('Licence number')
      expect(monthly[1][0]).to.equal('Return reference')
      expect(monthly[2][0]).to.equal('Site description')
      expect(monthly[3][0]).to.equal('Purpose')
      expect(monthly[4][0]).to.equal('Nil return Y/N')
      expect(monthly[5][0]).to.equal('Did you use a meter Y/N')
      expect(monthly[6][0]).to.equal('Meter make')
      expect(monthly[7][0]).to.equal('Meter serial number')
      expect(monthly[8][0]).to.equal('April 2018')
      expect(monthly[19][0]).to.equal('March 2019')
      expect(monthly[20][0]).to.equal('Unique return reference')
    })
  })

  experiment('.createReturnColumn', () => {
    experiment('for daily data', () => {
      let csvLines
      let ret

      beforeEach(async () => {
        csvLines = [
          { startDate: '2018-04-01', endDate: '2018-04-01', timePeriod: 'day' },
          { startDate: '2018-04-02', endDate: '2018-04-02', timePeriod: 'day' },
          { startDate: '2018-04-03', endDate: '2018-04-03', timePeriod: 'day' }
        ]

        ret = {
          returnId: 'v1:01/123',
          licenceNumber: '01/123',
          returnRequirement: '01234',
          frequency: 'day',
          startDate: '2018-04-01',
          endDate: '2018-04-02',
          siteDescription: 'test site desc',
          purposes: ['test purpose']
        }
      })

      test('passes the correct parameters to getRequiredLines helpers function', async () => {
        const getRequiredLinesSpy = sandbox.spy(helpers.returns.lines, 'getRequiredLines')
        csvTemplates._createReturnColumn(ret, csvLines)
        expect(getRequiredLinesSpy.calledWith(
          ret.startDate,
          ret.endDate,
          ret.frequency
        )).to.be.true()
      })

      test('creates a daily return column', async () => {
        const column = csvTemplates._createReturnColumn(ret, csvLines)

        expect(column).to.equal([
          '01/123',
          '01234',
          'test site desc',
          'test purpose',
          '',
          '',
          '',
          '',
          '',
          '',
          'Do not edit',
          'v1:01/123'
        ])
      })
    })

    test('creates a weekly return column', async () => {
      const csvLines = [
        { startDate: '2018-04-01', endDate: '2018-04-07', timePeriod: 'week' },
        { startDate: '2018-04-08', endDate: '2018-04-14', timePeriod: 'week' },
        { startDate: '2018-04-15', endDate: '2018-04-21', timePeriod: 'week' }
      ]

      const ret = {
        returnId: 'v1:01/123',
        licenceNumber: '01/123',
        returnRequirement: '01234',
        frequency: 'week',
        startDate: '2018-04-01',
        endDate: '2018-04-14',
        siteDescription: 'test site desc',
        purposes: ['test purpose']
      }

      const column = csvTemplates._createReturnColumn(ret, csvLines)
      expect(column).to.equal([
        '01/123',
        '01234',
        'test site desc',
        'test purpose',
        '',
        '',
        '',
        '',
        '',
        '',
        'Do not edit',
        'v1:01/123'
      ])
    })

    test('should create a monthly return column', async () => {
      const csvLines = [
        { startDate: '2018-04-01', endDate: '2018-04-30', timePeriod: 'month' },
        { startDate: '2018-05-01', endDate: '2018-05-31', timePeriod: 'month' },
        { startDate: '2018-06-01', endDate: '2018-06-30', timePeriod: 'month' }
      ]

      const ret = {
        returnId: 'v1:01/123',
        licenceNumber: '01/123',
        returnRequirement: '01234',
        frequency: 'month',
        startDate: '2018-04-01',
        endDate: '2018-05-31',
        siteDescription: 'test site desc',
        purposes: ['test purpose']
      }

      const column = csvTemplates._createReturnColumn(ret, csvLines)
      expect(column).to.equal([
        '01/123',
        '01234',
        'test site desc',
        'test purpose',
        '',
        '',
        '',
        '',
        '',
        '',
        'Do not edit',
        'v1:01/123'
      ])
    })
  })

  experiment('pushColumn', () => {
    test('adds a new column to a 2D array', async () => {
      const arr = [
        ['A', 'B'],
        ['C', 'D']
      ]
      csvTemplates._pushColumn(arr, ['X', 'Y'])
      expect(arr).to.equal([
        ['A', 'B', 'X'],
        ['C', 'D', 'Y']
      ])
    })
  })

  experiment('createCSVData', () => {
    test('should create CSV arrays grouped by return frequency', async () => {
      const returns = [{
        returnId: 'return_1',
        licenceNumber: 'licence_1',
        returnRequirement: 'requirement_1',
        startDate: '2018-04-01',
        endDate: '2019-03-31',
        frequency: 'day',
        siteDescription: 'test',
        purposes: []
      }, {
        returnId: 'return_2',
        licenceNumber: 'licence_2',
        returnRequirement: 'requirement_2',
        startDate: '2018-04-01',
        endDate: '2019-03-31',
        frequency: 'month',
        siteDescription: 'test',
        purposes: []
      }, {
        returnId: 'return_3',
        licenceNumber: 'licence_3',
        returnRequirement: 'requirement_3',
        startDate: '2018-04-01',
        endDate: '2019-03-31',
        frequency: 'week',
        siteDescription: 'test',
        purposes: []
      }]

      const csvData = csvTemplates.createCSVData(returns, '2019-03-31')

      // Daily
      expect(csvData.day[0][1]).to.equal('licence_1')
      expect(csvData.day[1][1]).to.equal('requirement_1')
      expect(csvData.day[373][1]).to.equal('return_1')

      // Monthly
      expect(csvData.month[0][1]).to.equal('licence_2')
      expect(csvData.month[1][1]).to.equal('requirement_2')
      expect(csvData.month[20][1]).to.equal('return_2')

      // Weekly
      expect(csvData.week[0][1]).to.equal('licence_3')
      expect(csvData.week[1][1]).to.equal('requirement_3')
      expect(csvData.week[60][1]).to.equal('return_3')
    })
  })

  experiment('getCSVFilename', () => {
    test('creates a filename based on the company name and daily return frequency', async () => {
      const result = csvTemplates._getCSVFilename('TEST CO', 'day', false)
      expect(result).to.equal('test co daily return.csv')
    })
    test('creates a filename based on the company name and weekly return frequency', async () => {
      const result = csvTemplates._getCSVFilename('TEST CO', 'week', false)
      expect(result).to.equal('test co weekly return.csv')
    })
    test('creates a filename based on the company name and monthly return frequency', async () => {
      const result = csvTemplates._getCSVFilename('TEST CO', 'month', false)
      expect(result).to.equal('test co monthly return.csv')
    })
    test('pluralises "return" to "returns" when isMultipleReturns is true', async () => {
      const result = csvTemplates._getCSVFilename('TEST CO', 'day', true)
      expect(result).to.equal('test co daily returns.csv')
    })
  })

  experiment('addCSVToArchive', () => {
    test('adds the CSV file specified in the key to the ZIP archive', async () => {
      const data = {
        day: [['foo', 'bar']]
      }
      await csvTemplates._addCSVToArchive(archive, 'TEST CO', data, 'day')

      const [csvStr, options] = archive.append.lastCall.args

      expect(csvStr).to.equal('foo,bar\n')
      expect(options.name).to.equal('test co daily return.csv')
    })
  })

  experiment('addReadmeToArchive', () => {
    test('adds the readme file to the ZIP archive', async () => {
      await csvTemplates._addReadmeToArchive(archive)

      const [str, options] = archive.append.lastCall.args

      expect(str).to.be.a.buffer()
      expect(options.name).to.equal('How to do bulk returns.txt')
    })
  })

  experiment('createArchive', () => {
    test('creates an archiver instance', async () => {
      const archiver = csvTemplates._createArchive()
      expect(archiver).to.be.an.object()
    })

    test('should log a warning on warning if error code is ENOENT', async () => {
      const err = new Error('Test')
      err.code = 'ENOENT'
      const archiver = csvTemplates._createArchive()
      archiver.emit('warning', err)
      expect(logger.warn.callCount).to.equal(1)
    })

    test('should throw an error on warning if error code is not ENOENT', async () => {
      const err = new Error('Test')
      const archiver = csvTemplates._createArchive()
      try {
        archiver.emit('warning', err)
        fail()
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })

    test('should throw an error on error', async () => {
      const err = new Error('Test')
      const archiver = csvTemplates._createArchive()
      try {
        archiver.emit('error', err)
        fail()
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })

  experiment('buildZip', () => {
    test('should build a zip file', async () => {
      const data = {
        day: [['foo', 'bar']]
      }
      const result = await csvTemplates.buildZip(data, 'TEST CO', archive)

      expect(result).to.be.an.object()

      expect(archive.append.callCount).to.equal(2)
      expect(archive.finalize.callCount).to.equal(1)
    })
  })
})
