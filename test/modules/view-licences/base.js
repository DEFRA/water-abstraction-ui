const { expect } = require('code');
const { it, experiment, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const IDM = require('../../../src/lib/connectors/idm');
const CRM = require('../../../src/lib/connectors/crm');
const baseController = require('../../../src/modules/view-licences/base');

experiment('view-licences/base', () => {
  const viewName = 'water/view-licences/licences';
  let h;

  beforeEach(async () => {
    sinon.stub(IDM, 'getUserByEmail');
    sinon.stub(CRM.documents, 'findMany');
    h = {
      view: sinon.spy()
    };
  });

  afterEach(async () => {
    IDM.getUserByEmail.restore();
    CRM.documents.findMany.restore();
  });

  experiment('when the form is invalid', () => {
    let request;

    beforeEach(async () => {
      request = {
        view: {},
        formError: { email: true }
      };
      baseController.getLicences(request, h);
    });

    it('the view is shown again', async () => {
      expect(h.view.calledWith(viewName, request.view)).to.be.true();
    });

    it('the controller does not get the user', async () => {
      expect(IDM.getUserByEmail.notCalled).to.be.true();
    });

    it('the controller does not get the licences', async () => {
      expect(CRM.documents.findMany.notCalled).to.be.true();
    });
  });

  experiment('when the user adds an unknown email address', () => {
    let request;

    beforeEach(async () => {
      request = {
        auth: {
          credentials: {
            entity_id: '123'
          }
        },
        view: {},
        query: {
          emailAddress: 'test@example.com'
        }
      };

      IDM.getUserByEmail.resolves({ data: [] });
      CRM.documents.findMany.resolves({
        data: [],
        error: null,
        pagination: {}
      });

      baseController.getLicences(request, h);
    });

    it('an attempt is made to get the user by email', async () => {
      expect(IDM.getUserByEmail.calledWith('test@example.com')).to.be.true();
    });

    it('an error is added to the view', async () => {
      expect(request.view.error).to.be.true();
    });
  });

  experiment('when the request is valid', async () => {
    let request;

    beforeEach(async () => {
      request = {
        auth: {
          credentials: {
            entity_id: '123'
          }
        },
        view: {},
        query: { page: 1 }
      };

      CRM.documents.findMany.resolves({
        data: [{ id: 1 }],
        error: null,
        pagination: { page: 1 }
      });

      baseController.getLicences(request, h);
    });

    it('the view is shown using the expected view template', async () => {
      expect(h.view.firstCall.args[0]).to.equal(viewName);
    });

    it('the data is added to the response', async () => {
      const viewContext = h.view.firstCall.args[1];
      expect(viewContext.licenceData[0].id).to.equal(1);
      expect(viewContext.pagination.page).to.equal(1);
    });
  });
});
