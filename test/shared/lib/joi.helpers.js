'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const Joi = require('joi');

const { createSchema } = require('shared/lib/joi.helpers');

experiment('shared/lib/schema', () => {
  const plainSchema = {
    a: Joi.string(),
    b: Joi.number(),
    c: Joi.string().required()
  };

  const existingSchema = Joi.object({
    a: Joi.string(),
    b: Joi.number(),
    c: Joi.string().required()
  });

  test('returns a joi schema when supplied with a plain object', () => {
    const schema = createSchema(plainSchema);

    expect(schema).to.be.instanceOf(Joi.constructor);
  });

  test('returns a joi schema when supplied with an existing schema', () => {
    const schema = createSchema(existingSchema);

    expect(schema).to.be.instanceOf(Joi.constructor);
  });

  test('returns a schema that can be validated as usual', () => {
    const testData = {
      a: 'testa',
      b: 2,
      c: null
    };

    const schema = createSchema(plainSchema);
    const result = schema.validate(testData);

    expect(result.error.details).to.have.length(1);
  });

  test('allows for global options to be overridden in a specific schema', () => {
    const customOptions = { abortEarly: true };
    const schema = createSchema(plainSchema, customOptions);

    expect(schema._preferences).to.equal(customOptions);
  });

  test('does not allow anything other than an object as schema param', () => {
    try {
      createSchema('cupcakes');
    } catch (e) {
      expect(e.message).to.equal('Invalid schema type, should be plain object or existing joi schema');
    }
  });

  test('does not allow anything other than an object as schema param', () => {
    try {
      createSchema(null);
    } catch (e) {
      expect(e.message).to.equal('Invalid schema type, should be plain object or existing joi schema');
    }
  });
});
