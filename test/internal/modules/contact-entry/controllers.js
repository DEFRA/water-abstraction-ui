'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const controller = require('../../../../src/internal/modules/contact-entry/controllers');
const ADDRESS_FLOW_SESSION_KEY = require('../../../../src/internal/modules/address-entry/plugin').SESSION_KEY;

let contactId = uuid();
let companyId = uuid();
let regionId = uuid();
let back = '/some/return/url';
let redirectPath = '/some/other/url';

const createRequest = (tempSessionKey, contactType = 'organisation') => {
  return ({
    query: {
      sessionKey: tempSessionKey,
      back: back
    },
    params: {
      regionId: regionId,
      companyId: companyId
    },
    view: {
      foo: 'bar',
      csrfToken: uuid()
    },
    pre: {
      companiesHouseResults: [{
        company: {
          companyNumber: '123456',
          name: 'some company name'
        }
      }],
      companiesHouseAddresses: [{
        'postal_code': 'GL10 1GL',
        'locality': 'Cheltenham',
        'address_line_2': 'Some place',
        'country': 'England'
      }],
      addressSearchResults: [],
      contactSearchResults: [{
        id: contactId,
        name: 'some name'
      }]
    },
    yar: {
      get: sandbox.stub().resolves({
        back: back,
        redirectPath: redirectPath,
        sessionKey: tempSessionKey,
        originalCompanyId: companyId,
        regionId: regionId,
        searchQuery: 'testco',
        accountType: contactType
      }),
      set: sandbox.stub(),
      clear: sandbox.stub()
    },
    server: {
      methods: {
        setDraftChargeInformation: sandbox.stub()
      }
    }
  });
};

experiment('internal/modules/contact-entry/controllers', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getNew', () => {
    let tempSessionKey;

    beforeEach(async () => {
      tempSessionKey = uuid();
      request = createRequest(tempSessionKey);
      await controller.getNew(request, h);
    });
    test('the client is redirected to the account type page', async () => {
      expect(h.redirect.lastCall.args[0]).to.equal(
        `/contact-entry/new/account-type?sessionKey=${tempSessionKey}`
      );
    });
    test('stores some data into the session', async () => {
      expect(request.yar.set.called).to.equal(true);
    });
  });

  experiment('.getSelectAccountTypeController', () => {
    let tempSessionKey;

    beforeEach(async () => {
      tempSessionKey = uuid();
      request = createRequest(tempSessionKey);
      await controller.getSelectAccountTypeController(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Select the account type');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSelectAccountTypeController', () => {
    let tempSessionKey;

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectAccountTypeController({ ...request, payload: { accountType: 'person', personName: 'John Doe', sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('yar set is called', async () => {
        expect(request.yar.set.called).to.be.true();
      });
      test('the client is redirected to the next page', async () => {
        expect(h.redirect.lastCall.args[0]).to.startWith(
          `/contact-entry/new/details?sessionKey=${tempSessionKey}`
        );
      });
    });
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectAccountTypeController({ ...request, payload: { accountType: 1, sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('the client is redirected back to the form', async () => {
        expect(h.postRedirectGet.lastCall.args[0].action).to.equal(
          `/contact-entry/new/account-type`
        );
      });
    });
  });

  experiment('.getDetailsController', () => {
    let tempSessionKey;

    experiment('when the type is an organisation', async () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey, 'organisation');
        await controller.getDetailsController(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('has the page title', async () => {
        const { pageTitle } = h.view.lastCall.args[1];
        expect(pageTitle).to.equal('Enter the company details');
      });

      test('passes through request.view', async () => {
        const { foo } = h.view.lastCall.args[1];
        expect(foo).to.equal(request.view.foo);
      });

      test('has a form', async () => {
        const { form } = h.view.lastCall.args[1];
        expect(form).to.be.an.object();
      });
    });
    experiment('when the type is a person', async () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey, 'person');
        await controller.getDetailsController(request, h);
      });

      test('the client is redirected to address entry', async () => {
        expect(h.redirect.lastCall.args[0]).to.startWith(
          `/address-entry/postcode`
        );
      });
    });
  });

  experiment('.getAddressEntered', () => {
    let tempSessionKey;

    beforeEach(async () => {
      tempSessionKey = uuid();
      request = createRequest(tempSessionKey, 'organisation');
      await controller.getAddressEntered(request, h);
    });

    test('yar get is called with the address flow key', async () => {
      expect(request.yar.get.calledWith(ADDRESS_FLOW_SESSION_KEY)).to.be.true();
    });

    test('yar set is called', async () => {
      expect(request.yar.set.called).to.be.true();
    });

    test('the client is redirected to the referring workflow', async () => {
      let pathCalled = h.redirect.lastCall.args[0];
      expect(pathCalled).to.startWith(redirectPath);
    });
  });

  experiment('.postCompanySearchController', () => {
    let tempSessionKey;
    experiment('when the form is valid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postCompanySearchController({ ...request, payload: { companyNameOrNumber: 'Mr John Doe', sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('yar set is called', async () => {
        expect(request.yar.set.called).to.be.true();
      });
      test('the client is redirected to the address entry module', async () => {
        let pathCalled = h.redirect.lastCall.args[0];
        expect(pathCalled).to.equal(
          `/contact-entry/new/details/company-search/select-company?sessionKey=${tempSessionKey}`
        );
      });
    });
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postCompanySearchController({ ...request, payload: { companyNameOrNumber: undefined, sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('the client is redirected back to the form', async () => {
        expect(h.postRedirectGet.lastCall.args[1]).to.equal(
          `/contact-entry/new/details`
        );
      });
    });
  });

  experiment('.getSelectCompanyController', () => {
    let tempSessionKey;
    beforeEach(async () => {
      tempSessionKey = uuid();
      request = createRequest(tempSessionKey);
      await controller.getSelectCompanyController(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/contact-entry/select-company');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSelectCompanyController', () => {
    let tempSessionKey;
    experiment('when the form is valid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectCompanyController({ ...request, payload: { selectedCompaniesHouseNumber: '123456', sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('yar set is called', async () => {
        expect(request.yar.set.called).to.be.true();
      });
      test('the client is redirected to select an address for the company', async () => {
        let pathCalled = h.redirect.lastCall.args[0];
        expect(pathCalled).to.equal(
          `/contact-entry/new/details/company-search/select-company-address?sessionKey=${tempSessionKey}`
        );
      });
    });
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectCompanyController({ ...request, payload: { selectedCompaniesHouseNumber: undefined, sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });
      test('the client is redirected back to the form', async () => {
        expect(h.postRedirectGet.lastCall.args[1]).to.equal(
          `/contact-entry/new/details/company-search/select-company`
        );
      });
    });
  });

  experiment('.getSelectCompanyAddressController', () => {
    let tempSessionKey;
    beforeEach(async () => {
      tempSessionKey = uuid();
      request = createRequest(tempSessionKey);
      await controller.getSelectCompanyAddressController(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSelectCompanyAddressController', () => {
    let tempSessionKey;
    experiment('when the form is valid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectCompanyAddressController({
          ...request,
          payload: {
            selectedCompaniesHouseAddress: JSON.stringify({
              addressLine1: '15 Aberdeen St',
              postcode: 'AB1 1AB'
            }),
            sessionKey: tempSessionKey,
            csrf_token: uuid()
          }
        }, h);
      });
      test('yar set is called', async () => {
        expect(request.yar.set.called).to.be.true();
      });
      test('the client is redirected to the back param', async () => {
        let pathCalled = h.redirect.lastCall.args[0];
        expect(pathCalled).to.startWith(redirectPath);
      });
    });
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectCompanyAddressController({ ...request, payload: { selectedCompaniesHouseAddress: undefined, sessionKey: tempSessionKey, csrf_token: uuid() } }, h);
      });

      test('the client is redirected to select an address for the company', async () => {
        let pathCalled = h.postRedirectGet.lastCall.args[1];
        expect(pathCalled).to.equal(
          `/contact-entry/new/details/company-search/select-company-address`
        );
      });
    });
  });
});
