'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const controller = require('../../../../src/shared/plugins/view-licence/controller');

experiment('shared/plugins/view-licence/controller', () => {
  let h;
  let request;
  let documentId;
  let licenceId;

  beforeEach(async () => {
    documentId = '00000000-0000-0000-0000-000000001111';
    licenceId = '00000000-0000-0000-0000-000000002222';

    request = {
      params: {
        documentId
      },
      licence: {
        summary: {
          licenceNumber: '123/123',
          waterLicence: {
            id: licenceId
          }
        }
      },
      view: {
      },
      auth: {
        credentials: {
        }
      }
    };

    h = {
      view: sandbox.stub(),
      realm: {
        pluginOptions: {
          getLicenceSummaryReturns: sandbox.stub(),
          getReturnPath: sandbox.stub()
        }
      }
    };
  });

  experiment('.getLicence', () => {
    let view;

    beforeEach(async () => {
      h.realm.pluginOptions.getLicenceSummaryReturns.resolves({
        data: [],
        pagination: { pageCount: 1 }
      });

      await controller.getLicence(request, h);
      view = h.view.lastCall.args[1];
    });

    test('uses the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/view-licences/licence');
    });

    test('adds the page title to the view object', async () => {
      expect(view.pageTitle).to.equal('Licence number 123/123');
    });

    test('sets hasMoreReturns to false because there is only one page', async () => {
      expect(view.hasMoreReturns).to.equal(false);
    });

    test('sets the back link', async () => {
      expect(view.back).to.equal('/licences');
    });

    test('sets the licence id', async () => {
      expect(view.licenceId).to.equal(licenceId);
    });
  });
});
