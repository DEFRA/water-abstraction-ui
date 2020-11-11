'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('@hapi/lab').script();
const { scope } = require('internal/lib/constants');
const uuid = require('uuid/v4');

const sandbox = require('sinon').createSandbox();

const services = require('internal/lib/connectors/services');
const licenceDataConfig = require('internal/lib/licence-data-config');

const DOCUMENT_ID = uuid();
const LICENCE_ID = uuid();

experiment('src/internal/lib/licence-data-config', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(services.water.licences, 'getByDocumentId').resolves({
      data: {
        id: LICENCE_ID
      }
    });
    sandbox.stub(services.water.chargeVersionWorkflows, 'getChargeVersionWorkflowsForLicence').resolves({
      data: []
    });
    sandbox.stub(services.water.chargeVersions, 'getChargeVersionsByDocumentId').resolves({
      data: [],
      error: null
    });
  });

  afterEach(async (request) => {
    sandbox.restore();
  });

  experiment('.getLicenceData', () => {
    experiment('when the method is not "getChargeVersionsByDocumentId"', () => {
      beforeEach(async () => {
        await licenceDataConfig.getLicenceData('getByDocumentId', DOCUMENT_ID);
      });

      test('the water service method is called', async () => {
        expect(services.water.licences.getByDocumentId.calledWith(
          DOCUMENT_ID
        )).to.be.true();
      });

      test('the charge version workflows are not fetched', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence.called).to.be.false();
      });

      test('the charge versions are not fetched', async () => {
        expect(services.water.chargeVersions.getChargeVersionsByDocumentId.called).to.be.false();
      });
    });

    experiment('when the method is "getChargeVersionsByDocumentId" and the user has charge_version_workflow_reviewer scope', () => {
      beforeEach(async () => {
        request = {
          auth: {
            credentials: {
              scope: [
                scope.chargeVersionWorkflowReviewer
              ]
            }
          }
        };
        await licenceDataConfig.getLicenceData('getChargeVersionsByDocumentId', DOCUMENT_ID, request);
      });

      test('the licence is loaded by ID', async () => {
        expect(services.water.licences.getByDocumentId.calledWith(
          DOCUMENT_ID
        )).to.be.true();
      });

      test('the charge version workflows are fetched by licence ID', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence.calledWith(LICENCE_ID)).to.be.true();
      });

      test('the charge versions are fetched by document ID', async () => {
        expect(services.water.chargeVersions.getChargeVersionsByDocumentId.calledWith(DOCUMENT_ID)).to.be.true();
      });
    });

    experiment('when the method is "getChargeVersionsByDocumentId" and the user has charge_version_workflow_editor scope', () => {
      beforeEach(async () => {
        request = {
          auth: {
            credentials: {
              scope: [
                scope.chargeVersionWorkflowEditor
              ]
            }
          }
        };
        await licenceDataConfig.getLicenceData('getChargeVersionsByDocumentId', DOCUMENT_ID, request);
      });

      test('the licence is loaded by ID', async () => {
        expect(services.water.licences.getByDocumentId.calledWith(
          DOCUMENT_ID
        )).to.be.true();
      });

      test('the charge version workflows are fetched by licence ID', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence.calledWith(LICENCE_ID)).to.be.true();
      });

      test('the charge versions are fetched by document ID', async () => {
        expect(services.water.chargeVersions.getChargeVersionsByDocumentId.calledWith(DOCUMENT_ID)).to.be.true();
      });
    });

    experiment('when the method is "getChargeVersionsByDocumentId" and the user has neither charge_version_workflow_editor/charge_version_workflow_reviewer scope', () => {
      beforeEach(async () => {
        request = {
          auth: {
            credentials: {
              scope: [

              ]
            }
          }
        };
        await licenceDataConfig.getLicenceData('getChargeVersionsByDocumentId', DOCUMENT_ID, request);
      });

      test('the licence is loaded by ID', async () => {
        expect(services.water.licences.getByDocumentId.calledWith(
          DOCUMENT_ID
        )).to.be.true();
      });

      test('the charge version workflows are not fetched', async () => {
        expect(services.water.chargeVersionWorkflows.getChargeVersionWorkflowsForLicence.called).to.be.false();
      });

      test('the charge versions are fetched by document ID', async () => {
        expect(services.water.chargeVersions.getChargeVersionsByDocumentId.calledWith(DOCUMENT_ID)).to.be.true();
      });
    });
  });
});
