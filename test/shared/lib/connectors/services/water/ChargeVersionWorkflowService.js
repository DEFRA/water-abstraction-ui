const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const { v4: uuid } = require('uuid');

const ChargeVersionWorkflowsService = require('shared/lib/connectors/services/water/ChargeVersionWorkflowsService');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('services/water/ChargeVersionsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'post');
    sandbox.stub(serviceRequest, 'delete');
    sandbox.stub(serviceRequest, 'patch');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicencesWithoutChargeInformation', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.getLicencesWithoutChargeInformation();
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/licences/without-charge-versions';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getChargeVersionWorkflows', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionWorkflows();
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/charge-version-workflows';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getChargeVersionWorkflow', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionWorkflow('charge-version-workflow-id');
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/charge-version-workflows/charge-version-workflow-id';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getChargeVersionWorkflow', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionWorkflowsForLicence('test-licence-id');
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/charge-version-workflows';
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected options to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.getChargeVersionWorkflowsForLicence('test-licence-id');
      const [, { qs }] = serviceRequest.get.lastCall.args;
      expect(qs.licenceId).to.equal('test-licence-id');
    });
  });

  experiment('.postChargeVersionWorkflow', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.postChargeVersionWorkflow({ foo: 'bar' });
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/charge-version-workflows';
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected options to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.postChargeVersionWorkflow({ foo: 'bar' });
      const [, options] = serviceRequest.post.lastCall.args;
      expect(options.body).to.equal({ foo: 'bar' });
    });
  });

  experiment('.patchChargeVersionWorkflow', () => {
    const tempGuid = uuid();
    const tempGuid2 = uuid();

    const expectedPatchObject = {
      approverComments: 'Pull up your socks',
      chargeVersion: tempGuid2,
      status: 'changes_requested'
    };

    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.patchChargeVersionWorkflow(tempGuid, expectedPatchObject);
      const expectedUrl = `http://127.0.0.1:8001/water/1.0/charge-version-workflows/${tempGuid}`;
      const [url] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected options to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.patchChargeVersionWorkflow(tempGuid, expectedPatchObject);
      const [, options] = serviceRequest.patch.lastCall.args;
      expect(options.body).to.equal(expectedPatchObject);
    });
  });

  experiment('.deleteChargeVersionWorkflow', () => {
    test('passes the expected URL to the service request', async () => {
      const service = new ChargeVersionWorkflowsService('http://127.0.0.1:8001/water/1.0');
      await service.deleteChargeVersionWorkflow('charge-version-workflow-id');

      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/charge-version-workflows/charge-version-workflow-id';
      const [url] = serviceRequest.delete.lastCall.args;

      expect(url).to.equal(expectedUrl);
    });
  });
});
