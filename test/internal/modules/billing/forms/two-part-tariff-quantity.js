'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const Joi = require('@hapi/joi');

const { schema } = require('../../../../../src/internal/modules/billing/forms/two-part-tariff-quantity');

experiment('internal/modules/billing/forms/two-part-tariff-quantity', () => {
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
      test('can be "authorised"', async () => {
        const result = tptSchema.quantity.validate('authorised');
        expect(result.error).to.equal(null);
      });

      test('can be "custom', async () => {
        const result = tptSchema.quantity.validate('custom');
        expect(result.error).to.equal(null);
      });

      test('cannot be another value', async () => {
        const result = tptSchema.quantity.validate('hello');
        expect(result.error).to.exist();
      });

      test('is required', async () => {
        const result = tptSchema.quantity.validate();
        expect(result.error).to.exist();
      });
    });

    experiment('customQuantity', () => {
      const getData = ({ customQuantity }) => ({
        csrf_token: uuid(),
        quantity: 'custom',
        customQuantity
      });

      experiment('when the quantity is of type "custom', () => {
        test('the customQuantity cannot be less than 0', async () => {
          const data = getData({ customQuantity: -1 });
          const result = Joi.validate(data, tptSchema);
          expect(result.error).to.exist();
        });

        test('the customQuantity cannot be greater than the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: 4 });
          const result = Joi.validate(data, tptSchema);
          expect(result.error).to.exist();
        });

        test('the customQuantity can equal the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: 3 });
          const result = Joi.validate(data, tptSchema);
          expect(result.error).to.equal(null);
        });

        test('the customQuantity can be greater than zero and less that the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: 2 });
          const result = Joi.validate(data, tptSchema);
          expect(result.error).to.equal(null);
        });
      });
    });
  });
});
