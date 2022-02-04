'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { adjustments } = require('../../../../../../src/internal/modules/charge-information/lib/charge-categories/mappers');

experiment('internal/modules/charge-information/lib/charge-elements/mappers', () => {
  experiment('.adjustments', () => {
    test('when the adjustments array is empty an object with an empty array is returned', () => {
      const result = adjustments({ adjustments: [] });
      expect(result).to.be.equal({ adjustments: {} });
    });

    test('when the adjustments array is not empty', () => {
      const result = adjustments({ adjustments: ['winter'] });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: null,
          charge: null,
          s126: null,
          s127: false,
          s130: false,
          winter: true
        }
      });
    });

    test('when the adjustments array includes the aggregate factor', () => {
      const result = adjustments({ adjustments: ['winter', 'aggregate'], aggregateFactor: 0.5 });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: 0.5,
          charge: null,
          s126: null,
          s127: false,
          s130: false,
          winter: true
        }
      });
    });
    test('when the adjustments array includes the charge adjustment factor', () => {
      const result = adjustments({ adjustments: ['winter', 'charge'], chargeFactor: 0.5 });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: null,
          charge: 0.5,
          s126: null,
          s127: false,
          s130: false,
          winter: true
        }
      });
    });
    test('when the adjustments array includes the s126 factor', () => {
      const result = adjustments({ adjustments: ['winter', 's126'], s126Factor: 0.5 });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: null,
          charge: null,
          s126: 0.5,
          s127: false,
          s130: false,
          winter: true
        }
      });
    });
    test('when the adjustments array includes the s127 adjustment', () => {
      const result = adjustments({ adjustments: ['winter', 'charge', 's127'], chargeFactor: 0.5 });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: null,
          charge: 0.5,
          s126: null,
          s127: true,
          s130: false,
          winter: true
        }
      });
    });
    test('when the adjustments array includes the s130 adjustment', () => {
      const result = adjustments({ adjustments: ['winter', 'charge', 's127', 's130'], chargeFactor: 0.5 });
      expect(result).to.be.equal({
        adjustments: {
          aggregate: null,
          charge: 0.5,
          s126: null,
          s127: true,
          s130: true,
          winter: true
        }
      });
    });
  });
});
