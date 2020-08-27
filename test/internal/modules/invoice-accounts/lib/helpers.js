'use-strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const dataService = require('../../../../../src/internal/modules/invoice-accounts/services/data-service');
const uuid = require('uuid');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const helpers = require('internal/modules/invoice-accounts/lib/helpers');
const forms = require('../../../../../src/shared/lib/forms/index');

experiment('internal/modules/incoive-accounts/lib/data-service', () => {
  const request = { test: 'request' };
  const regionId = uuid();
  const companyId = uuid();
  const formData = { test: 'data' };
  const tempId = '00000000-0000-0000-0000-000000000000';
  const address = {
    id: uuid(),
    addressLine1: 'Rock Farm Partnership',
    addressLine2: 'The Studios',
    addressLine3: 'Courtyards',
    addressLine4: null,
    town: 'Rawkyall',
    county: 'Rawkshire',
    postcode: 'RA1 1WK',
    country: 'England',
    uprn: null
  };
  const company = {
    id: companyId,
    name: 'A company name',
    type: 'person'
  };

  beforeEach(async () => {
    sandbox.stub(forms, 'getValues').returns({ selectedCompany: '', companySearch: '' });
    sandbox.stub(dataService, 'sessionManager').resolves({});
    sandbox.stub(dataService, 'getCompanyAddresses').returns([address, address]);
    sandbox.stub(dataService, 'getCompany').resolves(company);
    sandbox.stub(dataService, 'getCompanyContacts').resolves([{ id: 'test-id', firstName: 'Jackie', lastName: 'Smith' }]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processCompanyFormData', () => {
    test('gets the form values using the form data', async () => {
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = forms.getValues.lastCall.args;
      expect(args[0]).to.equal(formData);
    });

    test('returns the correct path if selectedCompany === comapny_search', async () => {
      forms.getValues.returns({ selectedCompany: 'company_search', companySearch: 'test name' });
      const response = helpers.processCompanyFormData(request, regionId, companyId, formData);
      expect(response).to.equal('company-search?filter=test name');
    });

    test('returns the correct path if selectedCompany === companyId', async () => {
      forms.getValues.returns({ selectedCompany: companyId, companySearch: '' });
      const response = helpers.processCompanyFormData(request, regionId, companyId, formData);
      expect(response).to.equal('select-address');
    });

    test('adds the agent: null to session data if selectedCompany === companyId', async () => {
      forms.getValues.returns({ selectedCompany: companyId, companySearch: '' });
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ agent: null });
    });

    test('adds the agent: null to session data if selectedCompany === companyId', async () => {
      const selectedCompany = uuid();
      forms.getValues.returns({ selectedCompany, companySearch: '' });
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ agent: selectedCompany });
    });
  });

  experiment('.processFaoFormData', () => {
    test('if addFao === yes', () => {
      const response = helpers.processFaoFormData(request, regionId, companyId, 'yes');
      expect(response).to.equal('select-contact');
    });

    test('if addFao === no returns the correct redirect path element', () => {
      const response = helpers.processFaoFormData(request, regionId, companyId, 'no');
      expect(response).to.equal('check-details');
    });
    test('if addFao === no returns the correct details are saved in the session', () => {
      helpers.processFaoFormData(request, regionId, companyId, 'no');
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: null });
    });
  });

  experiment('.getSelectedAddress', () => {
    test('returns the session address when the session address id === tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { addressId: tempId, addressLine1: 'test' } });
      expect(response).to.equal({ addressId: tempId, addressLine1: 'test' });
    });

    test('returns the address from the data service if the address != tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { addressId: address.id } });
      expect(response).to.equal(address);
    });
  });

  experiment('.getAgentCompany', () => {
    test('returns the session agent company when the session agent companyId === tempId', async () => {
      const response = await helpers.getAgentCompany({ agent: { companyId: tempId, name: 'A Company Name' } });
      expect(response).to.equal({ companyId: tempId, name: 'A Company Name' });
    });

    test('returns the agent company from the data service if the agent companyId != tempId', async () => {
      const response = await helpers.getAgentCompany({ agent: { companyId: 'test-company-id', name: 'A Company Name' } });
      expect(response).to.equal(company);
    });
  });

  experiment('.processSelectContactFormData', () => {
    test('if selected contact is department', () => {
      const department = 'test department name';
      const selectedContact = 'department';
      helpers.processSelectContactFormData(request, regionId, companyId, selectedContact, department);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: { department: 'test department name', type: 'department' } });
    });
    test('saves the contact id if selectedContact is a person with contact id', () => {
      const department = 'test department name';
      const selectedContact = 'test-contact-id';
      helpers.processSelectContactFormData(request, regionId, companyId, selectedContact, department);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: { contactId: 'test-contact-id' } });
    });
  });

  experiment('.getCOntactName', () => {
    test('if selected contact is department', () => {
      const department = 'test department name';
      const selectedContact = 'department';
      helpers.processSelectContactFormData(request, regionId, companyId, selectedContact, department);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: { department: 'test department name', type: 'department' } });
    });
    test('saves the contact id if selectedContact is a person with contact id', () => {
      const department = 'test department name';
      const selectedContact = 'test-contact-id';
      helpers.processSelectContactFormData(request, regionId, companyId, selectedContact, department);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: { contactId: 'test-contact-id' } });
    });
  });

  experiment('.getContactName', () => {
    test('if session contact type = person it returns the correct name', async () => {
      const sessionContact = { title: 'Mr', firstName: 'Chris', lastName: 'Brown', type: 'person' };
      const response = await helpers.getContactName(companyId, sessionContact);
      expect(response).to.equal('Mr Chris Brown');
    });
    test('if session contact type = department it returns the correct name', async () => {
      const sessionContact = { title: 'Mr', department: 'Finance', type: 'department' };
      const response = await helpers.getContactName(companyId, sessionContact);
      expect(response).to.equal('Finance');
    });
    test('if session contact is an existing contact it returns the correct name', async () => {
      const sessionContact = { contactId: 'test-id' };
      const response = await helpers.getContactName(companyId, sessionContact);
      expect(response).to.equal('Jackie Smith');
    });
  });

  experiment('.getName', () => {
    test('if contact name does not have a department it returns the correct name', async () => {
      const sessionContact = { title: 'Mr', firstName: 'Chris', lastName: 'Brown', type: 'person' };
      const response = helpers.getName(sessionContact);
      expect(response).to.equal('Mr Chris Brown');
    });
    test('if session contact does have department it returns the correct name', async () => {
      const sessionContact = { title: 'Mr', firstName: 'Kris', lastName: 'Kross', department: 'Finance' };
      const response = helpers.getName(sessionContact);
      expect(response).to.equal('Mr Kris Kross, Finance');
    });
    test('if session contact only has a deprtmant it returns the correct name', async () => {
      const sessionContact = { firstName: '', department: 'Finance' };
      const response = helpers.getName(sessionContact);
      expect(response).to.equal('Finance');
    });
  });

  experiment('.getFormTitleCaption', () => {
    test('returns the correct caption', async () => {
      const response = helpers.getFormTitleCaption('01/123');
      expect(response).to.equal('Licence 01/123');
    });
  });
});
