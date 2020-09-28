'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const preHandlers = require('internal/modules/agreements/pre-handlers');
const sharedPreHandlers = require('shared/lib/pre-handlers/licences');

const routes = require('internal/modules/agreements/routes');

experiment('internal/modules/agreements/routes', () => {
  experiment('.getDeleteAgreement', () => {
    test('limits scope to users with delete_agreements role', async () => {
      expect(routes.getDeleteAgreement.options.auth.scope)
        .to.only.include([scope.deleteAgreements]);
    });

    test('uses the loadAgreement pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[0].method)
        .to.equal(preHandlers.loadAgreement);
    });

    test('saves agreement to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[0].assign)
        .to.equal('agreement');
    });

    test('uses the loadLicence pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[1].method)
        .to.equal(sharedPreHandlers.loadLicence);
    });

    test('saves licence to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[1].assign)
        .to.equal('licence');
    });

    test('uses the loadDocument pre handler', async () => {
      expect(routes.getDeleteAgreement.options.pre[2].method)
        .to.equal(sharedPreHandlers.loadLicenceDocument);
    });

    test('saves document to expected place', async () => {
      expect(routes.getDeleteAgreement.options.pre[2].assign)
        .to.equal('document');
    });
  });

  experiment('.postDeleteAgreement', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.postDeleteAgreement.options.auth.scope)
        .to.only.include([scope.deleteAgreements]);
    });

    test('uses the loadDocument pre handler', async () => {
      expect(routes.postDeleteAgreement.options.pre[0].method)
        .to.equal(sharedPreHandlers.loadLicenceDocument);
    });

    test('saves document to expected place', async () => {
      expect(routes.postDeleteAgreement.options.pre[0].assign)
        .to.equal('document');
    });
  });
});
