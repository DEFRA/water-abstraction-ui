'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');

const { schema } = require('../../../../../src/internal/modules/billing/forms/two-part-tariff-quantity-confirm');

experiment('internal/modules/billing/forms/two-part-tariff-quantity-confirm', () => {
  experiment('schema', () => {
    let transaction;
    let tptSchema;

    beforeEach(async () => {
      transaction = {
        chargeElement: {
          authorisedAnnualQuantity: 1,
          billableAnnualQuantity: 2,
          maxAnnualQuantity: 3
        }
      };

      tptSchema = schema(transaction);
    });

    experiment('csrf_token', () => {
      test('can be a uuid', async () => {
        const result = tptSchema.csrf_token.validate(uuid());
        expect(result.error).to.equal(null);
      });

      test('cannot be a non uuid', async () => {
        const result = tptSchema.csrf_token.validate('hello');
        expect(result.error).to.exist();
      });

      test('is required', async () => {
        const result = tptSchema.csrf_token.validate();
        expect(result.error).to.exist();
      });
    });

    experiment('quantity', () => {
      const getData = ({ quantity }) => ({
        csrf_token: uuid(),
        quantity
      });

      test('is required', async () => {
        const data = getData({});
        const result = Joi.validate(data, tptSchema);
        expect(result.error).to.exist();
      });

      test('the quantity cannot be less than 0', async () => {
        const data = getData({ quantity: -1 });
        const result = Joi.validate(data, tptSchema);
        expect(result.error).to.exist();
      });

      test('the quantity cannot be greater than the maxAnnualQuantity', async () => {
        const data = getData({ quantity: 4 });
        const result = Joi.validate(data, tptSchema);
        expect(result.error).to.exist();
      });

      test('the quantity can equal the maxAnnualQuantity', async () => {
        const data = getData({ quantity: 3 });
        const result = Joi.validate(data, tptSchema);
        expect(result.error).to.equal(null);
      });

      test('the quantity can be greater than zero and less that the maxAnnualQuantity', async () => {
        const data = getData({ quantity: 2 });
        const result = Joi.validate(data, tptSchema);
        expect(result.error).to.equal(null);
      });
    });
  });
});
