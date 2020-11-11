'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const {
  licenceNumbersMapper,
  numberMapper,
  booleanMapper,
  defaultMapper,
  dateMapper,
  arrayMapper
} = require('shared/lib/forms/mappers');

experiment('defaultMapper', () => {
  const payload = {
    str: 'abc',
    number: 1334,
    null: null
  };

  test('Should import value unchanged', async () => {
    expect(defaultMapper.import('str', payload)).to.equal('abc');
    expect(defaultMapper.import('number', payload)).to.equal(1334);
    expect(defaultMapper.import('null', payload)).to.equal(null);
  });

  test('Should export value unchanged', async () => {
    expect(defaultMapper.export('abc')).to.equal('abc');
    expect(defaultMapper.export(1234)).to.equal(1234);
    expect(defaultMapper.export(null)).to.equal(null);
  });
});

experiment('licenceNumbersMapper', () => {
  const payload = {
    licenceNumbers: `01/123, 04/56/S/*/123; 192/1345/1442\n05/355/32`
  };
  const arr = ['01/123', '04/56/S/*/123', '192/1345/1442', '05/355/32'];
  const str = '01/123, 04/56/S/*/123, 192/1345/1442, 05/355/32';

  test('Should import a list of licences as an array', async () => {
    expect(licenceNumbersMapper.import('licenceNumbers', payload)).to.equal(arr);
  });

  test('Should export a list of licences as CSV', async () => {
    expect(licenceNumbersMapper.export(arr)).to.equal(str);
  });
});

experiment('numberMapper', () => {
  const payload = {
    integer: 123,
    float: 456.789,
    negative: -243.435,
    zero: 0,
    str: '345.34',
    null: '',
    withComma: '123,456.78'
  };

  test('Should import an integer', async () => {
    expect(numberMapper.import('integer', payload)).to.equal(123);
  });

  test('Should import a float', async () => {
    expect(numberMapper.import('float', payload)).to.equal(456.789);
  });

  test('Should import a negative number', async () => {
    expect(numberMapper.import('negative', payload)).to.equal(-243.435);
  });

  test('Should import zero as a number', async () => {
    expect(numberMapper.import('zero', payload)).to.equal(0);
  });

  test('Should import numeric string as a number', async () => {
    expect(numberMapper.import('str', payload)).to.equal(345.34);
  });

  test('Should import empty value as null', async () => {
    expect(numberMapper.import('null', payload)).to.equal(null);
  });

  test('should remove commas', async () => {
    expect(numberMapper.import('withComma', payload)).to.equal(123456.78);
  });

  test('Should export a number', async () => {
    expect(numberMapper.export(134.456)).to.equal(134.456);
  });

  test('Should export null', async () => {
    expect(numberMapper.export(null)).to.equal(null);
  });
});

experiment('booleanMapper', () => {
  const payload = {
    true: 'true',
    false: 'false',
    other: null
  };

  test('Should import true', async () => {
    expect(booleanMapper.import('true', payload)).to.equal(true);
  });

  test('Should import false', async () => {
    expect(booleanMapper.import('false', payload)).to.equal(false);
  });

  test('Other values are undefined', async () => {
    expect(booleanMapper.import('other', payload)).to.equal(undefined);
  });

  test('Should export true', async () => {
    expect(booleanMapper.export(true)).to.equal('true');
  });
  test('Should export false', async () => {
    expect(booleanMapper.export(false)).to.equal('false');
  });
  test('Should export other values as undefined', async () => {
    expect(booleanMapper.export('hello')).to.equal(undefined);
  });
});

experiment('dateMapper', () => {
  experiment('when the payload contains values', () => {
    const payload = {
      'field-day': '1',
      'field-month': '5',
      'field-year': '2018'
    };

    test('Should import date from separate day/month/year fields and convert to ISO 8601', async () => {
      expect(dateMapper.import('field', payload)).to.equal('2018-05-01');
    });

    test('Should export date as separate components for day/month/year', async () => {
      const value = dateMapper.export('2018-05-01');
      expect(value).to.equal({
        day: '01',
        month: '05',
        year: '2018'
      });
    });
  });

  experiment('when the payload contains some empty values', () => {
    const payload = {
      'field-day': '1',
      'field-month': '',
      'field-year': '2018'
    };

    test('Should import date from separate day/month/year fields and convert to ISO 8601', async () => {
      expect(dateMapper.import('field', payload)).to.equal('2018--01');
    });
  });

  experiment('when values are empty or whitespace only', () => {
    const payload = {
      'field-day': '',
      'field-month': ' ',
      'field-year': '   '
    };

    test('Imports the date as undefined', async () => {
      expect(dateMapper.import('field', payload)).to.be.undefined();
    });
  });
});

experiment('arrayMapper', () => {
  test('It should interpret no value as an empty array', async () => {
    const payload = {};
    expect(arrayMapper.import('field', payload)).to.equal([]);
  });

  test('It should convert a scalar to an array', async () => {
    const payload = {
      field: 'x'
    };
    expect(arrayMapper.import('field', payload)).to.equal(['x']);
  });

  test('It should pass an array through unchanged', async () => {
    const payload = {
      field: ['x', 'y']
    };
    expect(arrayMapper.import('field', payload)).to.equal(['x', 'y']);
  });

  test('exports the same value', async () => {
    expect(arrayMapper.export([1, 23])).to.equal([1, 23]);
  });
});
