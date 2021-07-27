'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const Joi = require('joi');
const { VALID_PASSWORD } = require('../../../src/shared/lib/validators');

experiment('validators', () => {
  experiment('.joiPasswordValidator', () => {
    test('when the password is valid the value is returned', () => {
      const result = Joi.object({ password: VALID_PASSWORD }).validate({ password: 'TestP@ssw0rd' });
      expect(result).to.equal({ value: { password: 'TestP@ssw0rd' } });
    });
  });
  test('when the password is too short the correct error is returned', () => {
    const result = Joi.object().keys({ password: VALID_PASSWORD }).validate({ password: 'TestP@s' });
    expect(result.error.details[0].message).to.equal('must contain at least 8 characters');
  });
  test('when the password is missing an uppercase character the correct error is returned', () => {
    const result = Joi.object().keys({ password: VALID_PASSWORD }).validate({ password: '1234ests@s' });
    expect(result.error.details[0].message).to.equal('must contain an uppercase character');
  });
  test('when the password is missing a special character the correct error is returned', () => {
    const result = Joi.object().keys({ password: VALID_PASSWORD }).validate({ password: 'Po87ss426dfs' });
    expect(result.error.details[0].message).to.equal('must contain a symbol');
  });
  test('when the password is null the correct error is returned', () => {
    const result = Joi.object().keys({ password: VALID_PASSWORD }).validate({ password: null });
    expect(result.error.details[0].message).to.equal('"password" must be a string');
  });
});
