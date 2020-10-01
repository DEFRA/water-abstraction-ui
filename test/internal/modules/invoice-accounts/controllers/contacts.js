'use-strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  before,
  after
} = exports.lab = require('@hapi/lab').script();
const controller = require('../../../../../src/internal/modules/invoice-accounts/controllers/contacts');
const uuid = require('uuid');
const sandbox = require('sinon').createSandbox();
const dataService = require('../../../../../src/internal/modules/invoice-accounts/services/data-service');
const forms = require('../../../../../src/shared/lib/forms/index');
const formsSelectContact = require('../../../../../src/internal/modules/invoice-accounts/forms/select-contact');
const sessionForms = require('shared/lib/session-forms');

experiment('./internal/modules/invoice-accounts/controller', () => {
  const regionId = uuid();
  const companyId = uuid();
  const licenceId = uuid();
  const agentId = uuid();
  const licenceNumber = '01/123';
  const companyName = 'test company name';
  const addressId = uuid();
  let h, request;

  const secondHeader = sandbox.stub();
  const header = sandbox.stub().returns({ header: secondHeader });

  const getSessionData = () => {
    return {
      companyId,
      regionId,
      address: { addressId },
      agent: { companyId: agentId },
      viewData: {
        redirectPath: '/somewhere',
        licenceNumber,
        licenceId,
        companyName
      }
    };
  };

  beforeEach(async => {
    sandbox.stub(dataService, 'getLicenceById').resolves({ licenceNumber });
    sandbox.stub(dataService, 'sessionManager').resolves(getSessionData());
    sandbox.stub(dataService, 'getCompanyAddresses').returns([]);
    sandbox.stub(dataService, 'getCompanyContacts').resolves([{ id: 'test-contact-id', firstName: 'Winston' }]);
    sandbox.stub(dataService, 'saveInvoiceAccDetails').resolves({ id: 'test-uuid-for-invoice-account' });
    sandbox.stub(forms, 'handleRequest').returns({ isValid: true });
    sandbox.stub(forms, 'getValues').returns({});
    sandbox.stub(sessionForms, 'get').returns(sandbox.stub(formsSelectContact, 'selectContactForm').returns({}));

    request = {
      params: {
        regionId,
        companyId
      },
      query: {
        redirectPath: '/somewhere',
        licenceId
      },
      view: {},
      yar: {
        get: sandbox.stub().returns({}),
        set: sandbox.stub(),
        clear: sandbox.stub()
      },
      pre: {
        companies: [],
        contactSearchResults: [],
        company: {
          id: companyId,
          name: companyName
        }
      }
    };

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };
  });

  afterEach(async => {
    sandbox.restore();
  });

  experiment('.getContactSelect', () => {
    test('calls sessionManager with the correct params', async () => {
      dataService.sessionManager.returns(getSessionData());
      await controller.getContactSelect(request, h);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
    });

    test('the correct data is passed to the view', async () => {
      const sessionData = getSessionData();
      sessionData.contact = { type: 'person', firstName: 'test-first-name' };
      dataService.sessionManager.returns(sessionData);
      await controller.getContactSelect(request, h);
      const args = h.view.lastCall.args[1];
      expect(args.caption).to.equal('Licence 01/123');
      expect(args.back).to.equal('/manage');
      expect(args.pageTitle).to.equal('Setup a contact for test company name');
    });

    test('calls the data service to get the company contacts with the correct company id', async () => {
      dataService.sessionManager.returns(getSessionData());
      await controller.getContactSelect(request, h);
      const args = dataService.getCompanyContacts.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });

    experiment('when a new contact was previously set during the session', () => {
      beforeEach(async => {
        dataService.getCompanyContacts.returns([{ id: 'test-contact-id', firstName: 'Winston' }]);
      });
      test('if the session contact = department the depertment text field value should be set correctly', async () => {
        const sessionData = getSessionData();
        sessionData.contact = { type: 'department', department: 'test department name' };
        dataService.sessionManager.returns(sessionData);
        await controller.getContactSelect(request, h);
        const { fields } = sessionForms.get.lastCall.args[1];
        expect(fields[0].value.fields[0].value).to.equal('test department name');
      });
      test('if the session contact = person the value selectedContact should be set correctly', async () => {
        const sessionData = getSessionData();
        sessionData.contact = { type: 'person', firstName: 'Winston' };
        dataService.sessionManager.returns(sessionData);
        await controller.getContactSelect(request, h);
        const { fields } = sessionForms.get.lastCall.args[1];
        expect(fields[0].value).to.equal({ value: 'person', label: 'Add a new person' });
      });
      test('if the session contact = person the value selectedContact should be set correctly', async () => {
        const session = { viewData: { licenceNumber: null }, contact: { contactId: 'test-contact-id' } };
        dataService.sessionManager.returns(session);
        await controller.getContactSelect(request, h);
        const { fields } = sessionForms.get.lastCall.args[1];
        expect(fields[0].value).to.equal({ value: 'test-contact-id', label: 'Winston' });
      });
    });
  });

  experiment('.postContactSelect', () => {
    experiment('when the form is valid', () => {
      test('and the contact selected = person then redirect to create a new contact', async () => {
        forms.getValues.returns({ selectedContact: 'person', department: null });
        await controller.postContactSelect(request, h);
        const args = h.redirect.lastCall.args;
        expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/create-contact`);
      });
      test('and the contact selected = department then save the selected contact', async () => {
        forms.getValues.returns({ selectedContact: 'department', department: 'Test department name' });
        await controller.postContactSelect(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ contact: { type: 'department', department: 'Test department name' } });
      });
      test('and the contact selected = department then redirect to check details', async () => {
        forms.getValues.returns({ selectedContact: 'department', department: 'Test department name' });
        await controller.postContactSelect(request, h);
        const args = h.redirect.lastCall.args;
        expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
      });
      test('and the contact selected = contact id then save the selected contact', async () => {
        forms.getValues.returns({ selectedContact: 'test-contact-id', department: null });
        await controller.postContactSelect(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ contact: { contactId: 'test-contact-id' } });
      });
      test('and the contact selected = contact id then redirect to check details', async () => {
        forms.getValues.returns({ selectedContact: 'test-contact-id', department: null });
        await controller.postContactSelect(request, h);
        const args = h.redirect.lastCall.args;
        expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
      });
    });
    experiment('when the form is not valid', () => {
      test('then redirect back to create new contact', async () => {
        forms.handleRequest.returns({ isValid: false });
        await controller.postContactSelect(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/select-contact`);
      });
    });
  });

  experiment('.getContactCreate', () => {
    test('calls sessionManager with the correct params', async () => {
      dataService.sessionManager.returns(getSessionData());
      await controller.getContactCreate(request, h);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
    });

    test('the correct data is passed to the view', async () => {
      const sessionData = getSessionData();
      sessionData.contact = { type: 'person', firstName: 'test-first-name' };
      dataService.sessionManager.returns(sessionData);
      await controller.getContactCreate(request, h);
      const args = h.view.lastCall.args[1];
      expect(args.caption).to.equal('Licence 01/123');
      expect(args.back).to.equal('/manage');
      expect(args.pageTitle).to.equal('Add a new contact for test company name');
    });
  });

  experiment('.postContactCreate', () => {
    experiment('when the form is valid', () => {
      test('then redirect to check details', async () => {
        const sessionData = getSessionData();
        dataService.sessionManager.returns(sessionData);
        forms.getValues.returns({});
        await controller.postContactCreate(request, h);
        const args = h.redirect.lastCall.args;
        expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
      });

      test('the correct contact details is saved in the session', async () => {
        const sessionData = getSessionData();
        dataService.sessionManager.returns(sessionData);
        const contact = { firstName: 'Johnty', lastName: 'Rhodes' };
        forms.getValues.returns(contact);
        await controller.postContactCreate(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ contact: { ...contact, type: 'person' } });
      });
    });
    experiment('when the form is not valid', () => {
      test('then redirect back to create new contact', async () => {
        forms.handleRequest.returns({ isValid: false });
        await controller.postContactCreate(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/create-contact`);
      });
    });
  });

  experiment('.getContactSearch', () => {
    beforeEach(async () => {
      await dataService.sessionManager.returns(getSessionData());
      await controller.getContactSearch(request, h);
    });
    afterEach(async () => {
      await sandbox.restore();
    });
    test('calls sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
    });

    test('the correct data is passed to the view', async () => {
      const sessionData = getSessionData();
      dataService.sessionManager.returns(sessionData);
      await controller.getContactSearch(request, h);
      const args = h.view.lastCall.args[1];
      expect(args.back).to.startWith(`/invoice-accounts/create/${regionId}/${companyId}`);
      expect(args.pageTitle).to.equal('Does this contact already exist?');
    });
  });

  experiment('.postContactSearch', async () => {
    experiment('when the form is valid', () => {
      experiment('when the user opts to create a new contact', () => {
        let modifiedRequest;
        beforeEach(async () => {
          modifiedRequest = { payload: { filter: 'some string', id: 'new' } };
          Object.assign(modifiedRequest, request);
          await dataService.sessionManager.returns(getSessionData());
          await controller.postContactSearch(modifiedRequest, h);
        });
        afterEach(async () => {
          await sandbox.restore();
        });
        test('then redirect to contact entry', async () => {
          await controller.postContactSearch(modifiedRequest, h);
          const args = h.redirect.lastCall.args;
          expect(args[0]).to.startWith(`/contact-entry/new`);
        });
      });
      experiment('when the user opts to select an existing contact', () => {
        const contactId = uuid();
        let modifiedRequest;
        before(async () => {
          modifiedRequest = { payload: { filter: 'some string', id: contactId } };
          Object.assign(modifiedRequest, request);
          await controller.postContactSearch(modifiedRequest, h);
        });
        after(async () => {
          await sandbox.restore();
        });
        test('then redirect to select an address', async () => {
          await controller.postContactSearch(modifiedRequest, h);
          const args = h.redirect.lastCall.args;
          expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/select-address`);
        });
      });
    });
  });
});
