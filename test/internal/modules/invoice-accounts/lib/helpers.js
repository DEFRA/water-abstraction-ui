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
  const request = { test: 'request', pre: { companies: [] } };
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

    test('returns the correct path if selectedCompany === company_search', async () => {
      forms.getValues.returns({ selectedCompany: 'company_search', companySearch: 'test name' });
      const response = helpers.processCompanyFormData(request, regionId, companyId, formData);
      expect(response).to.equal('contact-search?filter=test name');
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
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.contain({ agent: null });
    });

    test('adds the agent: id to session data if selectedCompany !== companyId', async () => {
      let modifiedRequest = request;
      const selectedCompany = uuid();
      modifiedRequest.pre.companies = [{ id: selectedCompany, name: 'some company ltd.' }];
      forms.getValues.returns({ selectedCompany, companySearch: '' });
      helpers.processCompanyFormData(modifiedRequest, regionId, companyId, formData);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(modifiedRequest);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.contain(['agent', 'viewData']);
    });
  });

  experiment('.getSelectedAddress', () => {
    test('returns the session address when the session address id === tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { addressId: tempId, addressLine1: 'test' } });
      expect(response).to.equal({ addressId: tempId, addressLine1: 'test' });
    });

    test('returns the address from the data service if the address != tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { id: address.id } });
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

  experiment('.getSelectedContact', () => {
    let companyContacts;
    beforeEach(() => {
      companyContacts = [{
        id: 'test-company-contact-1',
        type: 'person',
        firstName: 'Lewis',
        lastName: 'Hamilton'
      },
      {
        id: 'test-company-contact-2',
        type: 'person',
        firstName: 'Valtteri',
        lastName: 'Bottas'
      }];
    });
    test('if session contact is empty', async () => {
      const session = { contact: null };
      const response = await helpers.getSelectedContact(session, companyContacts);
      expect(response).to.equal('No');
    });

    test('if an existing contact has been selected', async () => {
      const session = { contact: { contactId: 'test-company-contact-2' } };
      const response = await helpers.getSelectedContact(session, companyContacts);
      expect(response).to.equal('Valtteri Bottas');
    });

    test('if session contact type = person it returns the correct name', async () => {
      const session = { contact: { title: 'Mr', firstName: 'George', lastName: 'Russel', type: 'person' } };
      const response = await helpers.getSelectedContact(session, companyContacts);
      expect(response).to.equal('Mr George Russel');
    });

    test('if session contact type = department it returns the correct name', async () => {
      const session = { contact: { department: 'Finance', type: 'department' } };
      const response = await helpers.getSelectedContact(session, companyContacts);
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
