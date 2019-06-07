'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const { flowConverter } = require('../../../../../src/external/lib/view-engine/filters/flow-converter');

lab.experiment('Invalid parameter', () => {
  lab.test('Throws error if invalid unit is given', async () => {
    const func = () => flowConverter(100, 'invalid', 'second');
    expect(func).to.throw();
  });

  lab.test('Throws error if invalid period is given', async () => {
    const func = () => flowConverter(100, 'litre', 'hour');
    expect(func).to.throw();
  });
});

lab.experiment('Valid parameters', () => {
  lab.test('Returns the correct value for litres/second', async () => {
    const result = flowConverter(100, 'litre', 'second');
    expect(result).to.equal('100000.0');
  });

  lab.test('Returns the correct value for megalitres/second', async () => {
    const result = flowConverter(100000, 'megalitre', 'second');
    expect(result).to.equal('100.0');
  });

  lab.test('Returns the correct value for cm/day', async () => {
    const result = flowConverter(100, 'cm', 'day');
    expect(result).to.equal('8640000.0');
  });

  lab.test('Returns the correct value for litre/day', async () => {
    const result = flowConverter(100, 'litre', 'day');
    expect(result).to.equal('8640000000.0');
  });

  lab.test('Returns the correct value for megalitre/day', async () => {
    const result = flowConverter(100, 'megalitre', 'day');
    expect(result).to.equal('8640.0');
  });
});
