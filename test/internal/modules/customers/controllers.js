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
const session = require('../../../../src/internal/modules/customers/session.js');
const formHandler = require('../../../../src/shared/lib/form-handler');
const services = require('../../../../src/internal/lib/connectors/services');
const { v4: uuid } = require('uuid');

const CONTACT_ID = uuid();
const CONTACT_OBJECT = {
  id: CONTACT_ID,
  firstName: 'Bruce',
  lastName: 'Gooday',
  fullName: 'Bruce Gooday',
  type: 'person',
  email: null
};

const BILLING_CONTACT_ID = uuid();
const BILLING_CONTACT_OBJECT = {
  id: BILLING_CONTACT_ID,
  firstName: 'Ima',
  lastName: 'Billing',
  fullName: 'Ima Billing',
  type: 'person',
  email: null
};

const DEPARTMENT_CONTACT_ID = uuid();
const DEPARTMENT_CONTACT_OBJECT = {
  id: DEPARTMENT_CONTACT_ID,
  department: 'Cheese',
  fullName: 'Cheese'
};
const ADDITIONAL_CONTACT_ROLE = {
  name: 'additionalContact'
};
const BILLING_ROLE = {
  name: 'billing'
};

const COMPANY_CONTACT_ARRAY = [
  { id: uuid(), contact: CONTACT_OBJECT, role: ADDITIONAL_CONTACT_ROLE },
  { id: uuid(), contact: BILLING_CONTACT_OBJECT, role: ADDITIONAL_CONTACT_ROLE },
  { id: uuid(), contact: BILLING_CONTACT_OBJECT, role: BILLING_ROLE },
  { id: uuid(), contact: DEPARTMENT_CONTACT_OBJECT, waterAbstractionAlertsEnabled: false }
];

const COMPANY_OBJECT = {
  name: 'ACME'
};

const EXPECTED_GET_COMPANY_LICENCES_RESPONSE = {
  data: [
    {
      documentRef: '101010'
    }
  ]
};

experiment('internal/modules/customers/controllers', () => {
  beforeEach(async () => {
    await sandbox.stub(services.water.contacts, 'patchContact').resolves({});
    await sandbox.stub(services.water.contacts, 'postContact').resolves({
      id: '123'
    });
    await sandbox.stub(services.water.companies, 'getContacts').resolves({ data: COMPANY_CONTACT_ARRAY });
    await sandbox.stub(services.water.companies, 'postCompanyContact').resolves({});
    await sandbox.stub(services.water.companies, 'patchCompanyContact').resolves({});
    await sandbox.stub(services.water.companies, 'getCompany').resolves(COMPANY_OBJECT);
    await sandbox.stub(services.water.companies, 'getCompanyInvoiceAccounts').resolves({ data: [] });
    await sandbox.stub(services.water.companies, 'getCompanyLicences').resolves(EXPECTED_GET_COMPANY_LICENCES_RESPONSE);
    await sandbox.stub(services.water.licences, 'getLicenceByLicenceNumber').resolves({});
    await sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({
      document_name: 'some-document-name'
    });

    await sandbox.stub(session, 'get').returns({ companyContactId: COMPANY_CONTACT_ARRAY[0].id });
    await sandbox.stub(session, 'merge').returns({});
    await sandbox.stub(session, 'clear').returns({});
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
      await controllers.getCustomerContact(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
  });

  experiment('.getUpdateCustomerContactName', () => {
    const request = {
      params: {
        companyId: uuid(),
        contactId: CONTACT_ID
      },
      defra: {
        userId: '1000'
      },
      path: 'http://defra.wrls/customers/123/contacts/456/name'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getUpdateCustomerContactName(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls session.merge to store contact', () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, { contactFromDatabase: CONTACT_OBJECT }]);
    });
  });

  experiment('.postUpdateCustomerContactName', () => {
    const title = 'Sir';
    const firstName = 'Fred';
    const lastName = 'Flintstone';
    const department = null;

    const request = {
      path: 'http://defra.wrls/customers/123/contacts/456/name',
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
      fields: [
        { name: 'title', value: title },
        { name: 'firstName', value: firstName },
        { name: 'lastName', value: lastName },
        { name: 'department', value: department }
      ]
    };

    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        await controllers.postUpdateCustomerContactName(request, h);
      });

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
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controllers.postUpdateCustomerContactName(request, h);
      });

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls patchContact endpoint', () => {
        const { args } = services.water.contacts.patchContact.lastCall;
        expect(args).to.equal([CONTACT_ID, { salutation: title, firstName, lastName, department }]);
      });
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
      path: 'http://defra.wrls/customers/123/contacts/456/email'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getAddCustomerContactEmail(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls session.merge to store waterAbstractionAlertsEnabled and email', () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, {
        waterAbstractionAlertsEnabledValueFromDatabase: CONTACT_OBJECT.waterAbstractionAlertsEnabled,
        emailAddressFromDatabase: CONTACT_OBJECT.email
      }]);
    });
  });

  experiment('.postAddCustomerContactEmail', () => {
    const email = 'some.valid.email@defra.gov.uk';
    const isNew = undefined;

    const request = {
      path: 'http://defra.wrls/customers/123/contacts/456/email',
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
      fields: [
        { name: 'email', value: email },
        { name: 'isNew', value: isNew }
      ]
    };

    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        await controllers.postAddCustomerContactEmail(request, h);
      });

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
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controllers.postAddCustomerContactEmail(request, h);
      });

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls patchContact endpoint', () => {
        const { args } = services.water.contacts.patchContact.lastCall;
        expect(args).to.equal([CONTACT_ID, { email }]);
      });
    });
  });

  experiment('.getUpdateCustomerContactDepartment', () => {
    const request = {
      params: {
        companyId: uuid(),
        contactId: DEPARTMENT_CONTACT_ID
      },
      defra: {
        userId: '1000'
      },
      path: 'http://defra.wrls/customers/123/contacts/456/department'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getUpdateCustomerContactDepartment(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls session.merge to store department', async () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, { departmentFromDatabase: DEPARTMENT_CONTACT_OBJECT.department }]);
    });
  });

  experiment('.postUpdateCustomerContactDepartment', () => {
    const department = 'Cheese';

    const request = {
      path: 'http://defra.wrls/customers/123/contacts/456/department',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      },
      params: {
        companyId: uuid(),
        contactId: DEPARTMENT_CONTACT_ID
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
      fields: [{ name: 'department', value: department }]
    };

    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        await controllers.postUpdateCustomerContactDepartment(request, h);
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
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controllers.postUpdateCustomerContactDepartment(request, h);
      });

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls patchContact endpoint', () => {
        const { args } = services.water.contacts.patchContact.lastCall;
        expect(args).to.equal([DEPARTMENT_CONTACT_ID, { department }]);
      });
    });
  });

  experiment('.getUpdateCustomerWaterAbstractionAlertsPreferences', () => {
    const request = {
      params: {
        companyId: uuid(),
        contactId: CONTACT_ID
      },
      defra: {
        userId: '1000'
      },
      path: 'http://defra.wrls/customers/123/contacts/456/water-abstraction-alerts-preferences'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getUpdateCustomerWaterAbstractionAlertsPreferences(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(request.params.companyId)).to.be.true();
    });
    test('calls session.merge to store waterAbstractionAlertsEnabled and email', () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, { waterAbstractionAlertsEnabledValueFromDatabase: CONTACT_OBJECT.waterAbstractionAlertsEnabled }]);
    });
  });

  experiment('.postUpdateCustomerWaterAbstractionAlertsPreferences', () => {
    const waterAbstractionAlertsEnabled = true;

    const request = {
      path: 'http://defra.wrls/customers/123/contacts/456/water-abstraction-alerts-preferences',
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
      fields: [{ name: 'waterAbstractionAlertsEnabled', value: waterAbstractionAlertsEnabled }]
    };

    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        await controllers.postUpdateCustomerWaterAbstractionAlertsPreferences(request, h);
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
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controllers.postUpdateCustomerWaterAbstractionAlertsPreferences(request, h);
      });

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls patchContact endpoint', () => {
        const { args } = services.water.companies.patchCompanyContact.lastCall;
        const { companyId, contactId } = request.params;
        expect(args).to.equal([companyId, contactId, { waterAbstractionAlertsEnabled }]);
      });
    });
  });

  experiment('.getSelectRemoveCompanyContact', () => {
    const companyId = uuid();
    const request = {
      params: {
        companyId
      },
      defra: {
        userId: '1000'
      },
      path: 'http://defra.wrls/customers/123/contacts/remove'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getSelectRemoveCompanyContact(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(companyId)).to.be.true();
    });
    test('calls session.merge to store waterAbstractionAlertsEnabled and email', () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, {
        companyId,
        companyContactsForRemoval: COMPANY_CONTACT_ARRAY
          .filter(({ role }) => role === ADDITIONAL_CONTACT_ROLE)
          .map(({ contact, id }) => ({ companyContactId: id, name: contact.fullName })),
        billingContactsExist: true,
        naldContactsExist: false
      }]);
    });
  });

  experiment('.getCheckRemoveCompanyContact', () => {
    const companyId = uuid();
    const companyContactId = COMPANY_CONTACT_ARRAY[0].id;

    const request = {
      params: {
        companyId
      },
      defra: {
        userId: '1000'
      },
      path: 'http://defra.wrls/customers/123/contacts/remove/check'
    };

    const h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    beforeEach(async () => {
      await controllers.getCheckRemoveCompanyContact(request, h);
    });

    test('calls the service method for fetching a company', async () => {
      expect(services.water.companies.getCompany.calledWith(companyId)).to.be.true();
    });
    test('calls the service method for fetching the company contacts', async () => {
      expect(services.water.companies.getContacts.calledWith(companyId)).to.be.true();
    });
    test('calls session.merge to store the ', () => {
      const { args } = session.merge.lastCall;
      expect(args).to.equal([request, {
        companyId,
        companyContactId,
        isLastEmailContact: false,
        contactName: CONTACT_OBJECT.fullName,
        companyName: COMPANY_OBJECT.name
      }]);
    });
  });
});
