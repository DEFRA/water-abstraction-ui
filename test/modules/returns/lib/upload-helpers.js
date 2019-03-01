const { expect, fail } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const fs = require('fs');
const EventEmitter = require('events');

const uploadHelpers = require('../../../../src/modules/returns/lib/upload-helpers.js');
const fileCheck = require('../../../../src/lib/file-check');

const csrfToken = '4a0b2424-6c02-45a5-9935-70a4c41538d2';
const errorMessages = {
  virus: 'The selected file contains a virus',
  notxml: 'The selected file must be an XML'
};

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
    sandbox.stub(fileCheck, 'isXml');
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
    test('it should return a filepath to an xml file with a uuid filename', async () => {
      const file = uploadHelpers.getFile();
      expect(file).to.be.a.string().and.to.contain(['/temp/', '.xml']);
    });
  });
  experiment('applyFormError', () => {
    test('Form is returned with no error message if no error', async () => {
      const error = undefined;
      expect(await uploadHelpers.applyFormError(form, error, errorMessages)).to.equal(form);
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
      expect(await uploadHelpers.applyFormError(form, error, errorMessages)).to.equal(updated);
    });
    test('Form is returned with notxml error message', async () => {
      const error = 'notxml';
      const updated = {
        ...form,
        errors: [{
          message: 'The selected file must be an XML',
          name: 'file'
        }]
      };
      expect(await uploadHelpers.applyFormError(form, error, errorMessages)).to.equal(updated);
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
  experiment('runChecks', () => {
    test('Returns undefined when both checks pass', async () => {
      fileCheck.virusCheck.returns(true);
      fileCheck.isXml.returns(true);
      expect(await uploadHelpers.runChecks('fileName')).to.equal(undefined);
    });

    test('Returns "/returns/upload?error=virus" when virus check fails', async () => {
      fileCheck.virusCheck.returns(false);
      fileCheck.isXml.returns(true);
      expect(await uploadHelpers.runChecks('fileName')).to.equal('/returns/upload?error=virus');
    });

    test('Returns "/returns/upload?error=notxml" when virus check fails', async () => {
      fileCheck.virusCheck.returns(true);
      fileCheck.isXml.returns(false);
      expect(await uploadHelpers.runChecks('fileName')).to.equal('/returns/upload?error=notxml');
    });
  });
});
