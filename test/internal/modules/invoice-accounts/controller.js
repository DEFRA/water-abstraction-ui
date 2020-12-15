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
const controller = require('../../../../src/internal/modules/invoice-accounts/controller');
const uuid = require('uuid');
const sandbox = require('sinon').createSandbox();
const dataService = require('../../../../src/internal/modules/invoice-accounts/services/data-service');
const forms = require('../../../../src/shared/lib/forms/index');
const sessionHelper = require('../../../../src/shared/lib/session-helpers');
const moment = require('moment');
const titleCase = require('title-case');

const ADDRESS_ENTRY_PATH = '/address/entry/path';
const CONTACT_ENTRY_PATH = '/contact/entry/path';

const ADDRESS = {
  addressLine1: 'Daisy Cottage',
  addressLine2: 'Buttercup Lane',
  addressLine3: null,
  addressLine4: null,
  town: 'Testington',
  county: 'Testingshire',
  postcode: 'TT1 1TT',
  country: 'United Kindom',
  uprn: null,
  source: 'wrls'
};

const CONTACT = {
  type: 'person',
  title: 'Mr',
  firstName: 'Lando',
  lastName: 'Norris'
};

experiment('./internal/modules/invoice-accounts/controller', () => {
  const regionId = uuid();
  const companyId = uuid();
  const licenceId = uuid();
  const licenceNumber = '01/123';
  const companyName = 'test company name';
  const anotherCompanyId = uuid();
  const anotherCompanyName = 'Some other Ltd.';
  const addressId = uuid();
  const agentId = uuid();
  let h, request;

  const secondHeader = sandbox.stub();
  const header = sandbox.stub().returns({ header: secondHeader });

  const sessionData = () => {
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
    sandbox.stub(dataService, 'sessionManager').returns(sessionData());
    sandbox.stub(dataService, 'getCompanyAddresses').returns([]);
    sandbox.stub(dataService, 'getCompany').returns({ id: agentId });
    sandbox.stub(sessionHelper, 'saveToSession').returns({ agent: { companyId: agentId }, address: { country: null } });
    sandbox.stub(dataService, 'saveInvoiceAccDetails').resolves({ id: 'test-uuid-for-invoice-account' });
    sandbox.stub(forms, 'handleRequest').returns({ isValid: true });
    sandbox.stub(forms, 'getValues').returns({});

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
        companies: [{
          id: companyId,
          name: companyName
        }],
        contactSearchResults: [{
          id: anotherCompanyId,
          name: anotherCompanyName
        }],
        company: {
          id: companyId,
          name: companyName
        }
      },
      addressLookupRedirect: sandbox.stub().returns(ADDRESS_ENTRY_PATH),
      getNewAddress: sandbox.stub().returns(ADDRESS),
      contactEntryRedirect: sandbox.stub().returns(CONTACT_ENTRY_PATH),
      getNewContact: sandbox.stub().returns(CONTACT)
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

  experiment('.getCompany', () => {
    beforeEach(async () => {
      await controller.getCompany(request, h);
    });
    test('calls dataService.getLicenceById with the correct query param', async () => {
      const args = dataService.getLicenceById.lastCall.args;
      expect(args[0]).to.equal(licenceId);
    });
    test('calls sessionManager with the correct params', async () => {
      const viewData = { viewData: { redirectPath: '/somewhere', licenceNumber, licenceId, companyName: titleCase(companyName) } };
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal(viewData);
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/form');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Who should the bills go to?');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.getCompany with no licenceId in request.query', () => {
    test('the caption has the correct value assigned if the licenceId was not provided', async () => {
      delete request.query.licenceId;
      await controller.getCompany(request, h);
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('');
    });
  });

  experiment('.postCompany', () => {
    experiment('when the form is valid', () => {
      test('and the companyId selected = companyId then agent = null', async () => {
        forms.getValues.returns({
          selectedCompany: companyId,
          companySearch: null
        });
        await controller.postCompany(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ agent: null });
      });
      test('and a company has been selected the user is rdirected to the select address path', async () => {
        forms.getValues.returns({
          selectedCompany: companyId,
          companySearch: null
        });
        await controller.postCompany(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/select-address`;
        expect(args[0]).to.equal(redirectPath);
      });
      test('and a company search name has been entered the user is rdirected to the search company path', async () => {
        forms.getValues.returns({
          selectedCompany: 'company_search',
          companySearch: 'Company Name To Search for'
        });
        await controller.postCompany(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/contact-search?filter=Company Name To Search for`;
        expect(args[0]).to.equal(redirectPath);
      });
    });
    experiment('when the form is not valid', () => {
      test('the user is redirected back to select company form', async () => {
        forms.handleRequest.returns({ isValid: false });
        dataService.sessionManager.returns({ viewData: { redirectPath: '/somewhere' } });
        await controller.postCompany(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}`);
        expect(args[2]).to.equal({ redirectPath: '/somewhere' });
      });
    });
  });

  experiment('.getAddress', () => {
    beforeEach(async () => {
      await controller.getAddress(request, h);
    });

    test('calls request.addressLookupRedirect to get the redirect path', async () => {
      const [params] = request.addressLookupRedirect.lastCall.args;
      expect(params.redirectPath).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/address-entered`);
      expect(params.back).to.equal(`/invoice-accounts/create/${regionId}/${companyId}`);
      expect(params.key).to.equal(`new-invoice-account-${companyId}`);
      expect(params.companyId).to.be.undefined();
      expect(params.caption).to.equal('Licence 01/123');
    });

    test('calls h.redirect to redirect to the address entry plugin flow', async () => {
      expect(
        h.redirect.calledWith(ADDRESS_ENTRY_PATH)
      ).to.be.true();
    });
  });

  experiment('.getAddressEntered', () => {
    beforeEach(async () => {
      await controller.getAddressEntered(request, h);
    });

    test('calls request.getNewAddress with correct key', async () => {
      expect(request.getNewAddress.calledWith(
        `new-invoice-account-${companyId}`
      )).to.be.true();
    });

    test('sets the new address in the session', async () => {
      expect(dataService.sessionManager.calledWith(
        request, regionId, companyId, { address: ADDRESS }
      )).to.be.true();
    });

    test('client is redirected to the check your answers page', async () => {
      const args = h.redirect.lastCall.args;
      expect(args[0]).to.startWith(`/invoice-accounts/create/${regionId}/${companyId}/add-fao`);
    });
  });

  experiment('.getContactEntered', () => {
    beforeEach(async () => {
      await controller.getContactEntered(request, h);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: CONTACT });
    });

    test('client is redirected to check your answers page', async () => {
      expect(h.redirect.calledWith(`/invoice-accounts/create/${regionId}/${companyId}/check-details`)).to.be.true();
    });
  });

  experiment('.getFao', () => {
    beforeEach(async () => {
      await controller.getFao(request, h);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/form');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Do you need to add an FAO?');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.startWith('/invoice-accounts/create');
    });
  });

  experiment('.postFao', () => {
    experiment('when the form is not valid', () => {
      test('the user is redirected to the get page with errors', async () => {
        forms.handleRequest.returns({ isValid: false });
        await controller.postFao(request, h);
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the form is valid', () => {
      experiment('and the FAO is required', () => {
        beforeEach(async () => {
          forms.getValues.returns({ faoRequired: true });
          await controller.postFao(request, h);
        });

        test('calls request.addressLookupRedirect to get the redirect path', async () => {
          const [params] = request.contactEntryRedirect.lastCall.args;
          expect(params.redirectPath).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/contact-entered`);
          expect(params.back).to.equal(`/invoice-accounts/create/${regionId}/${companyId}`);
          expect(params.key).to.equal(`new-invoice-account-${companyId}`);
          expect(params.companyId).to.be.undefined();
          expect(params.caption).to.equal('Licence 01/123');
        });

        test('redirects the user to the contact entry plugin', async () => {
          const [path] = h.redirect.lastCall.args;
          expect(path).to.equal(CONTACT_ENTRY_PATH);
        });
      });
      test('and the FAO is not required, the user is redirected to the check-details page', async () => {
        forms.getValues.returns({ faoRequired: false });
        await controller.postFao(request, h);
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/check-details`);
      });
    });
  });

  experiment('.getCheckDetails', () => {
    beforeEach(async () => {
      await controller.getCheckDetails(request, h);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });

    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/invoice-accounts/check-details');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Check billing account details');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.postCheckDetails', () => {
    beforeEach(async () => {
      await controller.postCheckDetails(request, h);
    });

    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.firstCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
    });

    test('calls the dataservice.saveInvoiceAccountDetails with the correct data shape and params', () => {
      const startDate = moment().format('YYYY-MM-DD');
      const details = [companyId, { address: { addressId }, agent: { companyId: agentId }, contact: undefined, regionId, startDate }];
      const args = dataService.saveInvoiceAccDetails.lastCall.args;
      expect(args).to.equal(details);
    });
  });

  experiment('.getSearchCompany', () => {
    beforeEach(async () => {
      await dataService.sessionManager.returns(sessionData());
      await controller.getSearchCompany(request, h);
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
      dataService.sessionManager.returns(sessionData());
      await controller.getSearchCompany(request, h);
      const args = h.view.lastCall.args[1];
      expect(args.back).to.startWith(`/invoice-accounts/create/${regionId}/${companyId}`);
      expect(args.pageTitle).to.equal('Does this contact already exist?');
    });
  });

  experiment('.postSearchCompany', async () => {
    experiment('when the form is valid', () => {
      experiment('when the user opts to create a new contact', () => {
        let modifiedRequest;
        beforeEach(async () => {
          modifiedRequest = { payload: { filter: 'some string', id: 'new' } };
          Object.assign(modifiedRequest, request);
          await dataService.sessionManager.returns(sessionData());
          await controller.postSearchCompany(modifiedRequest, h);
        });
        afterEach(async () => {
          await sandbox.restore();
        });
        test('then redirect to contact entry', async () => {
          await controller.postSearchCompany(modifiedRequest, h);
          const args = h.redirect.lastCall.args;
          expect(args[0]).to.startWith(`/contact-entry/new`);
        });
      });
      experiment('when the user opts to select an existing contact', () => {
        let modifiedRequest;
        before(async () => {
          modifiedRequest = { payload: { filter: 'some string', id: anotherCompanyId } };
          Object.assign(modifiedRequest, request);
          await controller.postSearchCompany(modifiedRequest, h);
        });
        after(async () => {
          await sandbox.restore();
        });
        test('then redirect to select an address', async () => {
          await controller.postSearchCompany(modifiedRequest, h);
          const args = h.redirect.lastCall.args;
          expect(args[0]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/select-address`);
        });
      });
    });
  });
});
