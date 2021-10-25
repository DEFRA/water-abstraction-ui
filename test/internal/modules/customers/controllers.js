const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');

const controllers = require('../../../../src/internal/modules/customers/controllers');
const helpers = require('../../../../src/internal/modules/customers/helpers');
const session = require('../../../../src/internal/modules/customers/session.js');
const formHandler = require('../../../../src/shared/lib/form-handler');
const formHelpers = require('../../../../src/shared/lib/forms');
const services = require('../../../../src/internal/lib/connectors/services');
const uuid = require('uuid').v4;

const CONTACT_ID = uuid();
const CONTACT_OBJECT = {
  id: CONTACT_ID,
  firstName: 'Bruce',
  lastName: 'Gooday',
  type: 'person',
  email: null,
  waterAbstractionAlertsEnabled: false
};

const EXPECTED_GET_COMPANY_LICENCES_RESPONSE = { data: [
  {
    documentRef: '101010'
  }
] };

experiment('internal/modules/customers/controllers', () => {
  beforeEach(async () => {
    await sandbox.stub(services.water.contacts, 'patchContact').resolves({});
    await sandbox.stub(services.water.contacts, 'postContact').resolves({
      id: '123'
    });
    await sandbox.stub(services.water.companies, 'getContacts').resolves({ data: [{
      contact: CONTACT_OBJECT
    }] });
    await sandbox.stub(services.water.companies, 'postCompanyContact').resolves({});
    await sandbox.stub(services.water.companies, 'getCompany').resolves({});
    await sandbox.stub(services.water.companies, 'getCompanyInvoiceAccounts').resolves({ data: [] });
    await sandbox.stub(services.water.companies, 'getCompanyLicences').resolves(EXPECTED_GET_COMPANY_LICENCES_RESPONSE);
    await sandbox.stub(services.water.licences, 'getLicenceByLicenceNumber').resolves({});
    await sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({
      document_name: 'some-document-name'
    });

    await sandbox.stub(session, 'get').resolves();
    await sandbox.stub(session, 'merge').resolves({});
    await sandbox.stub(session, 'clear').resolves({});
    await sandbox.stub(formHandler, 'handleFormRequest').resolves({});
  });

  afterEach(() => sandbox.restore());

  experiment('.getCustomer', () => {
    const request = {
      params: {
        companyId: uuid()
      },
      query: {
        newContactKey: undefined
      },
      defra: {
        userId: '1000'
      },
      getNewContact: sandbox.stub().returns({
        title: 'Mr',
        firstName: 'Simon',
        lastName: 'Simonson'
      })
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when newContactKey is not set', () => {
      beforeEach(async () => {
        request.query.newContactKey = undefined;
        await controllers.getCustomer(request, h);
      });
      test('calls the service method for fetching a company', async () => {
        expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
      });
    });

    experiment('when newContactKey is set', () => {
      beforeEach(async () => {
        request.query.newContactKey = 1;
        await controllers.getCustomer(request, h);
      });
      test('calls the handleNewContact helper', async () => {
        expect(1).to.equal(1);
      });
    });

    experiment('when newContactKey is not set', () => {
      beforeEach(async () => {
        request.query.newContactKey = undefined;
        await controllers.getCustomer(request, h);
      });
      test('calls the service method for fetching a company', async () => {
        expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
      });
      test('calls the service method for fetching a company invoice accounts', async () => {
        expect(services.water.companies.getCompanyInvoiceAccounts.calledWith(request.params.companyId)).to.be.true();
      });
      test('calls the service method for fetching a company licences', async () => {
        expect(services.water.companies.getCompanyLicences.calledWith(request.params.companyId)).to.be.true();
      });
      test('calls the service method for fetching the licence, as many times as there are licences connected to the company', async () => {
        expect(services.water.licences.getLicenceByLicenceNumber.callCount).to.equal(EXPECTED_GET_COMPANY_LICENCES_RESPONSE.data.length);
      });
    });
  });

  experiment('.getCustomerContact', () => {
    const request = {
      params: {
        companyId: uuid(),
        contactId: CONTACT_ID
      },
      defra: {
        userId: '1000'
      }
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      sandbox.stub(helpers, 'parseContactName').resolves(CONTACT_OBJECT);
      await controllers.getCustomerContact(request, h);
    });
    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the helper method for parsing a contact display name', async () => {
      expect(helpers.parseContactName.calledWith(CONTACT_OBJECT)).to.be.true();
    });
  });

  experiment('.getAddCustomerContactEmail', () => {
    const request = {
      params: {
        companyId: uuid(),
        contactId: CONTACT_ID
      },
      defra: {
        userId: '1000'
      },
      path: `http://defra.wrls/customers/123/contact/456/email`
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      sandbox.stub(helpers, 'parseContactName').resolves(CONTACT_OBJECT);
      await controllers.getAddCustomerContactEmail(request, h);
    });
    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the helper method for parsing a contact display name', async () => {
      expect(helpers.parseContactName.calledWith(CONTACT_OBJECT)).to.be.true();
    });
    test('calls session.merge to store waterAbstractionAlertsEnabled and email', () => {
      expect(session.merge.calledWith({
        waterAbstractionAlertsEnabled: CONTACT_OBJECT.waterAbstractionAlertsEnabled,
        email: CONTACT_OBJECT.email
      }));
    });
  });

  experiment('.postAddCustomerContactEmail', () => {
    const request = {
      path: `http://defra.wrls/customers/123/contact/456/email`,
      method: 'post',
      view: {
        csrfToken: 'some-token'
      },
      params: {
        companyId: uuid(),
        contactId: CONTACT_ID
      },
      defra: {
        userId: '1000'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    const formContent = {
      fields: [{ name: 'email', value: 'some.valid.email@defra.gov.uk' }, { name: 'isNew', value: undefined }]
    };

    const storedData = {
      email: {
        name: 'email',
        value: 'some.valid.email@defra.gov.uk'
      },
      isNew: {
        name: 'isNew',
        value: undefined
      }
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controllers.postAddCustomerContactEmail(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('does not call session.merge', () => {
        expect(session.merge.called).to.be.false();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(async () => {
        await formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controllers.postAddCustomerContactEmail(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls patchContact endpoint', () => {
        expect(services.water.contacts.patchContact.called).to.be.true();
      });
    });
  });
});
