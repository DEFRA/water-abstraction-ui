'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const Joi = require('joi');

const { VALID_PASSWORD } = require('../../../src/external/lib/validators');
const { formatViewError } = require('../../../src/external/lib/helpers');

const schema = {
  password: VALID_PASSWORD
};
const options = {
  abortEarly: false
};

lab.experiment('Test Joi password validation', () => {
  lab.test('Should reject empty password', async () => {
    const password = '';

    const { error } = Joi.validate({ password }, schema, options);
    const viewError = formatViewError(error);

    Code.expect(viewError).to.equal({
      password_empty: true,
      password_uppercase: true,
      password_symbol: true,
      password_min: true
    });
  });

  lab.test('Should reject a password which is too short', async () => {
    const password = 'Hello!';

    const { error } = Joi.validate({ password }, schema, options);
    const viewError = formatViewError(error);

    Code.expect(viewError).to.equal({
      password_min: true
    });
  });

  lab.test('Should reject a password which has no uppercase character', async () => {
    const password = 'hello1234$%^!';

    const { error } = Joi.validate({ password }, schema, options);
    const viewError = formatViewError(error);

    Code.expect(viewError).to.equal({
      password_uppercase: true
    });
  });

  lab.test('Should reject a password which has no special character', async () => {
    const password = 'Hello12345THERE';

    const { error } = Joi.validate({ password }, schema, options);
    const viewError = formatViewError(error);

    Code.expect(viewError).to.equal({
      password_symbol: true
    });
  });

  lab.test('Should flag multiple errors', async () => {
    const password = 'hello12345678';

    const { error } = Joi.validate({ password }, schema, options);
    const viewError = formatViewError(error);

    Code.expect(viewError).to.equal({
      password_uppercase: true,
      password_symbol: true
    });
  });
});
