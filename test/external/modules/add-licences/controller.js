const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const crmConnector = require('external/lib/connectors/crm');
const services = require('external/lib/connectors/services');
const controller = require('external/modules/add-licences/controller');
const forms = require('shared/lib/forms');
const uuid = require('uuid');

experiment('postAddressSelect', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      yar: {
        get: () => ({
          selectedIds: [1, 2]
        }),
        set: () => ({
          selectedAddressId: 1
        }),
        clear: sinon.spy(),
        data: {
          addLicenceFlow: {
            selectedIds: [1, 2],
            selectedAddressId: 1
          }
        }
      },
      auth: {
        credentials: {
        }
      },
      defra: {
        entityId: 'test-entity-id'
      },
      payload: {
        selectedAddressId: 1
      },
      view: {},
      cookieAuth: {
        set: sinon.spy()
      }
    };

    h = {
      redirect: sinon.spy(),
      view: sinon.spy()
    };

    sandbox.stub(services.crm.documents, 'findMany').resolves({
      error: null,
      data: [{ document_id: '789', metadata: { Name: 'test-company-name' } }]
    });

    sandbox.stub(services.crm.documents, 'findOne').resolves({
      error: null,
      data: { licence_ref: 'test-licence-id' }
    });

    sandbox.stub(forms, 'handleRequest').returns({ isValid: true, fields: [{ name: 'selectedAddressId', errors: [] }] });

    sandbox.stub(crmConnector, 'getOrCreateCompanyEntity').resolves('test-company-entity-id');
    sandbox.stub(services.crm.verifications, 'createVerification').resolves({
      verification_code: 'test-verification-code'
    });

    sandbox.stub(services.water.notifications, 'sendSecurityCode').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('renders expected page if form is valid', async () => {
    await controller.postAddressSelect(request, h);

    const [path] = h.redirect.lastCall.args;
    expect(path).to.equal('/add-addressee');
  });

  test('renders expected page if form is invalid', async () => {
    forms.handleRequest.returns({ isValid: false });
    await controller.postAddressSelect(request, h);

    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/form');
  });

  experiment('when payload address id is not in the selected documents', () => {
    test('an error is not thrown', async () => {
      request.payload.selectedAddressId = 999;
      await expect(controller.postAddressSelect(request, h)).to.not.reject();
    });
  });

  test('throws if the crm licences cannot be read', async () => {
    services.crm.documents.findMany.resolves({
      error: 'bad news',
      data: null
    });

    await expect(controller.postAddressSelect(request, h)).to.reject();
  });
});

experiment('postFAO', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      yar: {
        get: () => ({
          selectedIds: [1, 2]
        }),
        data: {
          addLicenceFlow: {
            selectedAddressId: 1
          }
        },
        set: sinon.spy(),
        clear: sinon.spy()
      },
      defra: {
        entityId: 'test-entity-id'
      },
      payload: {
        selectedAddressId: 1,
        fao: 'name'
      },
      view: {},
      cookieAuth: {
        set: sinon.spy()
      }
    };

    h = {
      redirect: sinon.spy(),
      view: sinon.spy()
    };

    sandbox.stub(services.crm.documents, 'findMany').resolves({
      error: null,
      data: [{ document_id: '789', metadata: { Name: 'test-company-name' } }]
    });

    sandbox.stub(services.crm.documents, 'findOne').resolves({
      error: null,
      data: { licence_ref: 'test-licence-id' }
    });

    sandbox.stub(crmConnector, 'getOrCreateCompanyEntity').resolves('test-company-entity-id');
    sandbox.stub(services.crm.verifications, 'createVerification').resolves({
      verification_code: 'test-verification-code'
    });

    sandbox.stub(services.water.notifications, 'sendSecurityCode').resolves();

    sandbox.stub(forms, 'handleRequest').returns({ isValid: true, fields: [{ name: 'selectedAddressId', errors: [] }] });
  });

  afterEach(async () => {
    sandbox.restore();
  });
  test('renders expected page if form is valid', async () => {
    await controller.postFAO(request, h);

    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/add-licences/verification-sent');
  });

  test('renders expected page if form is invalid', async () => {
    forms.handleRequest.returns({ isValid: false });
    await controller.postFAO(request, h);

    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/form');
  });

  test('gets the company id user entity id', async () => {
    await controller.postFAO(request, h);
    const [companyEntityId, companyName] = crmConnector.getOrCreateCompanyEntity.lastCall.args;
    expect(companyEntityId).to.equal('test-entity-id');
    expect(companyName).to.equal('test-company-name');
  });

  test('uses the company id to create the verification', async () => {
    await controller.postFAO(request, h);
    const [entityId, companyEntityId, selectedIds] = services.crm.verifications.createVerification.lastCall.args;

    expect(entityId).to.equal('test-entity-id');
    expect(companyEntityId).to.equal('test-company-entity-id');
    expect(selectedIds).to.equal([1, 2]);
  });

  test('throws if the licences cannot be read', async () => {
    services.crm.documents.findMany.onSecondCall().resolves({
      error: 'bang',
      data: null
    });

    await expect(controller.postFAO(request, h)).to.reject();
  });

  test('delete the licence flow and address data from session', async () => {
    await controller.postFAO(request, h);
    expect(request.yar.clear.calledWith('addLicenceFlow')).to.be.true();
  });

  test('renders the expected view', async () => {
    await controller.postFAO(request, h);
    const [viewName] = h.view.lastCall.args;
    expect(viewName).to.equal('nunjucks/add-licences/verification-sent');
  });

  test('passes the expected data to the view', async () => {
    await controller.postFAO(request, h);
    const [, viewData] = h.view.lastCall.args;
    expect(viewData.pageTitle).to.equal('We are sending you a letter');
    expect(viewData.verification.verification_code).to.equal('test-verification-code');
    expect(viewData.licence.licence_ref).to.equal('test-licence-id');
    expect(viewData.licenceCount).to.equal(1);
    expect(viewData.fao).to.equal('name');
  });

  test('adds the company id to the cookie', async () => {
    await controller.postFAO(request, h);

    expect(request.yar.set.calledWith('companyId', 'test-company-entity-id'))
      .to.be.true();

    expect(request.yar.set.calledWith('companyName', 'test-company-name'))
      .to.be.true();
  });
});

experiment('ensureSessionDataPreHandler', () => {
  let request;
  let h;
  let takeoverSpy;

  beforeEach(async () => {
    takeoverSpy = sinon.spy();
    request = {
      yar: {
        get: sinon.stub().returns()
      }
    };

    h = {
      continue: Symbol('test-continue'),
      redirect: sinon.stub().returns({
        takeover: takeoverSpy
      })
    };
  });

  experiment('when the data is in session', () => {
    test('continue is returned', async () => {
      request.yar.get.returns({ test: true });
      const result = controller.ensureSessionDataPreHandler(request, h);
      expect(result).to.equal(h.continue);
    });
  });

  experiment('when the data is not found in the session', () => {
    test('the user is redirected to the add-licences page', async () => {
      controller.ensureSessionDataPreHandler(request, h);
      const [redirect] = h.redirect.lastCall.args;
      expect(redirect).to.equal('/add-licences');
      expect(takeoverSpy.called).to.be.true();
    });
  });
});

experiment('.postSecurityCode', () => {
  const request = {
    view: {},
    defra: {},
    payload: {
      verification_code: '12345',
      csrf_token: uuid()
    }
  };
  const reply = {
    redirect: sandbox.stub(),
    view: sandbox.stub()
  };

  beforeEach(aysnc => {
    sandbox.stub(crmConnector, 'verify').resolves();
    sandbox.stub(crmConnector, 'getOutstandingLicenceRequests').resolves();
  });
  afterEach(async () => {
    sandbox.restore();
  });
  experiment('for a valid payload', () => {
    test('the user is redirected to /licences', async () => {
      await controller.postSecurityCode(request, reply);
      expect(reply.redirect.lastCall.args[0]).to.equal('/licences');
    });
  });
  experiment('for an invalid payload', () => {
    test('user is redirected to /add-licences/security-code', async () => {
      request.payload.verification_code = '';
      await controller.postSecurityCode(request, reply);
      expect(reply.view.lastCall.args[0]).to.equal('nunjucks/add-licences/security-code');
    });
  });
});
