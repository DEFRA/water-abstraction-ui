const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('lab').script();
const { expect } = require('code');

const ReturnsService = require('shared/lib/connectors/services/water/ReturnsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const responses = {
  error: {
    error: 'oh no'
  },
  multi: {
    error: null,
    data: [{ returnId: 'test-return-id' }]
  }
};

experiment('services/water/ReturnsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves(responses.multi);
    sandbox.stub(serviceRequest, 'post').resolves(responses.multi);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturn', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.getReturn('return-1');

      const expectedUrl = `http://127.0.0.1:8001/water/1.0/returns`;
      const expectedQuery = {
        qs: { returnId: 'return-1' }
      };

      const [url, query] = serviceRequest.get.lastCall.args;

      expect(url).to.equal(expectedUrl);
      expect(query).to.equal(expectedQuery);
    });

    test('optionally includes the version number', async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.getReturn('return-1', 'version-1');

      const expectedQuery = {
        qs: { returnId: 'return-1', versionNumber: 'version-1' }
      };
      const [, query] = serviceRequest.get.lastCall.args;

      expect(query).to.equal(expectedQuery);
    });
  });

  experiment('.postReturn', () => {
    let service;

    beforeEach(async () => {
      service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.postReturn({
        data: 'content'
      });
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/returns`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the body data to the service request', async () => {
      const expectedOptions = {
        body: { data: 'content' }
      };
      const [, options] = serviceRequest.post.lastCall.args;

      expect(options).to.equal(expectedOptions);
    });
  });

  experiment('.postUpload', () => {
    beforeEach(async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.postUpload('file-data', 'user-name');
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/returns/upload/xml`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('lowercases the file type', async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.postUpload('file-data', 'user-name', 'CSV');

      const expectedUrl = `http://127.0.0.1:8001/water/1.0/returns/upload/csv`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the body data to the service request', async () => {
      const expectedOptions = {
        body: { fileData: 'file-data', userName: 'user-name' }
      };
      const [, options] = serviceRequest.post.lastCall.args;

      expect(options).to.equal(expectedOptions);
    });
  });

  experiment('.postUploadSubmit', () => {
    let service;

    beforeEach(async () => {
      serviceRequest.post.resolves({
        error: null,
        data: {
          foo: 'bar'
        }
      });

      service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
      await service.postUploadSubmit('event-id', {
        entityId: 'entity-id',
        companyId: 'company-id',
        userName: 'user-name'
      });
    });

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/returns/upload-submit/event-id`;
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected options to the service request', async () => {
      const expectedOptions = {
        qs: {
          entityId: 'entity-id',
          companyId: 'company-id',
          userName: 'user-name'
        }
      };
      const [, options] = serviceRequest.post.lastCall.args;

      expect(options).to.equal(expectedOptions);
    });

    test('resolves with data from the API call', async () => {
      const data = await service.postUploadSubmit('event-id', {});
      expect(data).to.equal({ foo: 'bar' });
    });

    test('should throw an error if the API response contains an error', async () => {
      serviceRequest.post.resolves({ error: 'oh no!' });
      const func = () => service.postUploadSubmit('event-id', {});
      expect(func()).to.reject();
    });
  });

  experiment('.postUploadPreview', () => {
    let service;

    beforeEach(async () => {
      service = new ReturnsService('http://127.0.0.1:8001/water/1.0');
    });

    test('calls service request with correct url', async () => {
      await service.getUploadPreview('event-id', { query: 'string' });
      const [uri] = serviceRequest.get.lastCall.args;
      expect(uri).to.equal('http://127.0.0.1:8001/water/1.0/returns/upload-preview/event-id');
    });

    test('calls service request with correct options', async () => {
      await service.getUploadPreview('event-id', { query: 'string' });
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options).to.equal({
        qs: {
          query: 'string'
        }
      });
    });

    test('should throw an error if API returns error response', async () => {
      serviceRequest.get.resolves(responses.error);
      const func = () => service.getUploadPreview('event-id', {});
      expect(func()).to.reject();
    });

    test('resolves with data from API response', async () => {
      const response = await service.getUploadPreview('event-id', {});
      expect(response).to.equal(responses.multi.data);
    });

    test('calls service request with correct URL if return ID supplied', async () => {
      await service.getUploadPreview('event-id', {}, 'return-id');
      const [uri] = serviceRequest.get.lastCall.args;
      expect(uri).to.equal('http://127.0.0.1:8001/water/1.0/returns/upload-preview/event-id/return-id');
    });
  });
});
