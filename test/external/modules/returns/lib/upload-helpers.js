const { expect, fail } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const fs = require('fs');
const EventEmitter = require('events');

const uploadHelpers = require('../../../../../src/external/modules/returns/lib/upload-helpers');
const { errorMessages } = require('../../../../../src/external/modules/returns/controllers/upload');
const fileCheck = require('../../../../../src/external/lib/file-check');

const csrfToken = '4a0b2424-6c02-45a5-9935-70a4c41538d2';

const form = {
  file: {
    name: 'file',
    label: 'Upload a file'
  },
  paragraph: {
    name: '',
    text: 'The licence holder is responsible for the data you are sending.'
  },
  button: {
    name: null,
    label: 'Upload'
  },
  hidden: {
    csrf_token: csrfToken
  }
};

const sandbox = sinon.createSandbox();
experiment('upload Helpers', () => {
  let write;
  let read;

  beforeEach(async () => {
    sandbox.stub(fileCheck, 'virusCheck');
    write = new EventEmitter();
    sandbox.spy(write, 'on');

    read = new EventEmitter();
    sandbox.spy(read, 'on');
    read.pipe = sandbox.spy();

    sandbox.stub(fs, 'createWriteStream').returns(write);
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getFile', () => {
    test('it should return a filepath to a file with a uuid filename', async () => {
      const file = uploadHelpers.getFile();
      expect(file).to.be.a.string().and.to.include('/temp/');
    });
  });
  experiment('applyFormError', () => {
    test('Form is returned with no error message if no error', async () => {
      const error = undefined;
      const output = await uploadHelpers.applyFormError(form, error, errorMessages);
      expect(output).to.equal(form);
    });

    test('Form is returned with virus error message', async () => {
      const error = 'virus';
      const updated = {
        ...form,
        errors: [{
          message: 'The selected file contains a virus',
          name: 'file'
        }]
      };
      const output = await uploadHelpers.applyFormError(form, error, errorMessages);
      expect(output).to.equal(updated);
    });
    test('Form is returned with notxml error message', async () => {
      const error = 'notxml';
      const updated = {
        ...form,
        errors: [{
          message: 'The selected file must be a CSV or XML file',
          name: 'file'
        }]
      };
      const output = await uploadHelpers.applyFormError(form, error, errorMessages);
      expect(output).to.equal(updated);
    });
  });
  experiment('uploadFile', () => {
    test('read pipes to write', async () => {
      uploadHelpers.uploadFile(read, '/dev/null');
      expect(read.pipe.calledWith(write)).to.be.true();
    });

    test('resolves when the write stream finishes', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          expect(write.on.calledWith('finish')).to.be.true();
        })
        .catch(() => {
          fail('Write stream finishing should resolve');
        });

      write.emit('finish');
    });

    test('rejects when the write stream errors', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          fail('Write stream erroring should reject');
        })
        .catch(() => {
          expect(write.on.calledWith('error')).to.be.true();
        });

      write.emit('error');
    });

    test('rejects when the read stream errors', async () => {
      uploadHelpers.uploadFile(read, '/dev/null')
        .then(() => {
          fail('Read stream erroring should reject');
        })
        .catch(() => {
          expect(read.on.calledWith('error')).to.be.true();
        });

      read.emit('error');
    });
  });

  experiment('getUploadedFileStatus', () => {
    test('returns OK status when virus check passes and supported file type', async () => {
      fileCheck.virusCheck.resolves(true);
      const status = await uploadHelpers.getUploadedFileStatus('fileName', 'xml');
      expect(status).to.equal(uploadHelpers.fileStatuses.OK);
    });

    test('returns virus status when virus check fails', async () => {
      fileCheck.virusCheck.resolves(false);
      const status = await uploadHelpers.getUploadedFileStatus('fileName', 'xml');
      expect(status).to.equal(uploadHelpers.fileStatuses.VIRUS);
    });

    test('returns invalid type status when unsupported file type supplied', async () => {
      fileCheck.virusCheck.resolves(true);
      const checkResults = await uploadHelpers.getUploadedFileStatus('fileName', 'ppt');
      expect(checkResults).to.equal(uploadHelpers.fileStatuses.INVALID_TYPE);
    });
  });
});
