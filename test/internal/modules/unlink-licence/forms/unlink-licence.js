const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const { findField, findButton } = require('../../../../lib/form-test');
const { unlinkLicenceForm, unlinkLicenceSchema } = require('internal/modules/unlink-licence/forms/unlink-licence');

const request = {
  params: {
    documentId: 'doc-id'
  },
  query: {
    userId: 'user-id'
  },
  view: {
    csrfToken: 'token'
  }
};

const licenceData = {
  licenceNumber: 'lic-no',
  companyName: 'company-name'
};

experiment('modules/unlink-licence/forms/unlink-licence', () => {
  experiment('form', () => {
    let form;
    beforeEach(() => {
      form = unlinkLicenceForm(request, licenceData);
    });

    test('sets the form method to POST', async () => {
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(request.view.csrfToken);
    });

    test('has a checkbox to confirm unlinking licence', async () => {
      const confirmUnlink = findField(form, 'confirmUnlink');
      expect(confirmUnlink).to.exist();
    });

    test('has a submit button', async () => {
      const button = findButton(form);
      expect(button.options.label).to.equal('Unlink this licence');
    });
  });
  experiment('schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = unlinkLicenceSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = unlinkLicenceSchema.csrf_token.validate('pasta');
        expect(result.error).to.exist();
      });
    });
    experiment('confirm checkbox', () => {
      test('validates for a single item array containing "confirm"', async () => {
        const result = unlinkLicenceSchema.confirmUnlink.validate(['confirm']);
        expect(result.error).to.be.null();
      });

      test('fails for an empty array', async () => {
        const result = unlinkLicenceSchema.confirmUnlink.validate([]);
        expect(result.error).to.exist();
      });

      test('fails for a two element array', async () => {
        const result = unlinkLicenceSchema.confirmUnlink.validate(['cofirm', 'confirm']);
        expect(result.error).to.exist();
      });

      test('fails for a singl element array with incorrect element', async () => {
        const result = unlinkLicenceSchema.confirmUnlink.validate(['invalid']);
        expect(result.error).to.exist();
      });
    });
  });
});
