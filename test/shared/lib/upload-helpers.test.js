const { expect, fail } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const fs = require('fs')
const config = require('external/config')
const EventEmitter = require('events')

const { errorMessages } = require('external/modules/returns/controllers/upload')
const fileCheck = require('shared/lib/file-check')

const csrfToken = '4a0b2424-6c02-45a5-9935-70a4c41538d2'

const mockServices = {
  water: {
    events: {
      findMany: () => {}
    }
  }
}
const mockLogger = {
  error: () => {}
}

const UploadHelpers = require('shared/lib/upload-helpers')
const uploadHelpers = new UploadHelpers('test-upload', ['csv'], mockServices, mockLogger)

const form = {
  file: {
    name: 'file',
    label: 'Upload a file'
  },
  paragraph: {
    name: '',
    text: 'The licence holder is responsible for the data You\'re sending.'
  },
  button: {
    name: null,
    label: 'Upload'
  },
  hidden: {
    csrf_token: csrfToken
  }
}

const sandbox = sinon.createSandbox()
experiment('upload Helpers', () => {
  let write
  let read

  beforeEach(async () => {
    sandbox.stub(fileCheck, 'virusCheck')
    sandbox.stub(config, 'testMode').value(false)
    write = new EventEmitter()
    sandbox.spy(write, 'on')

    read = new EventEmitter()
    sandbox.spy(read, 'on')
    read.pipe = sandbox.spy()

    sandbox.stub(fs, 'createWriteStream').returns(write)

    sandbox.stub(mockLogger, 'error')
  })
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getFile', () => {
    test('it should return a filepath to a file with a uuid filename', async () => {
      const file = uploadHelpers.getFile()
      expect(file).to.be.a.string().and.to.include('/temp/')
    })
  })
  experiment('applyFormError', () => {
    test('Form is returned with no error message if no error', async () => {
      const error = undefined
      const output = await uploadHelpers.applyFormError(form, error, errorMessages)
      expect(output).to.equal(form)
    })

    test('Form is returned with virus error message', async () => {
      const error = 'virus'
      const updated = {
        ...form,
        errors: [{
          message: 'The selected file contains a virus',
          name: 'file'
        }]
      }
      const output = await uploadHelpers.applyFormError(form, error, errorMessages)
      expect(output).to.equal(updated)
    })
    test('Form is returned with invalid-type error message', async () => {
      const error = 'invalid-type'
      const updated = {
        ...form,
        errors: [{
          message: 'The selected file must be a CSV file',
          name: 'file'
        }]
      }
      const output = await uploadHelpers.applyFormError(form, error, errorMessages)
      expect(output).to.equal(updated)
    })
    test('Form is returned with no-file error message', async () => {
      const error = 'no-file'
      const updated = {
        ...form,
        errors: [{
          message: 'Select a CSV file',
          name: 'file'
        }]
      }
      const output = await uploadHelpers.applyFormError(form, error, errorMessages)
      expect(output).to.equal(updated)
    })
  })
  experiment('uploadFile', () => {
    test('read pipes to write', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
      expect(read.pipe.calledWith(write)).to.be.true()
    })

    test('resolves when the write stream finishes', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          expect(write.on.calledWith('finish')).to.be.true()
        })
        .catch(() => {
          fail('Write stream finishing should resolve')
        })

      write.emit('finish')
    })

    test('rejects when the write stream errors', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          fail('Write stream erroring should reject')
        })
        .catch(() => {
          expect(write.on.calledWith('error')).to.be.true()
        })

      write.emit('error')
    })

    test('rejects when the read stream errors', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          fail('Read stream erroring should reject')
        })
        .catch(() => {
          expect(read.on.calledWith('error')).to.be.true()
        })

      read.emit('error')
    })
  })

  experiment('getUploadedFileStatus', () => {
    const { OK, VIRUS, INVALID_TYPE } = UploadHelpers.fileStatuses
    test('returns OK status when virus check passes and supported file type', async () => {
      await fileCheck.virusCheck.resolves({ isClean: true })
      const status = await uploadHelpers.getUploadedFileStatus('fileName', 'csv')
      expect(status).to.equal(OK)
    })

    test('returns virus status when virus check fails', async () => {
      await fileCheck.virusCheck.resolves({ isClean: false })
      const status = await uploadHelpers.getUploadedFileStatus('fileName', 'csv')
      expect(status).to.equal(VIRUS)
    })

    test('returns invalid type status when unsupported file type supplied', async () => {
      await fileCheck.virusCheck.resolves({ isClean: true })
      const checkResults = await uploadHelpers.getUploadedFileStatus('fileName', 'ppt')
      expect(checkResults).to.equal(INVALID_TYPE)
    })

    test('logs the error if the file is infected', async () => {
      await fileCheck.virusCheck.resolves({ isClean: false })
      await uploadHelpers.getUploadedFileStatus('fileName')
      expect(mockLogger.error.callCount).to.equal(1)
    })
  })
})
