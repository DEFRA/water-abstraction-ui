'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const contactMapper = require('shared/lib/mappers/contact');

experiment('src/internal/modules/contact-entry/pre-handlers .mapContactToString', () => {
  let result;
  test('returns null when contact is not an object', () => {
    result = contactMapper.mapContactToString('test');
    expect(result).to.equal(null);
  });

  test('when contact type is "department" returns department', () => {
    result = contactMapper.mapContactToString({
      type: 'department',
      department: 'Test Department'
    });
    expect(result).to.equal('Test Department');
  });

  experiment('when contact type is "person"', () => {
    test('maps contact name into a string', () => {
      result = contactMapper.mapContactToString({
        type: 'person',
        firstName: 'Valtteri',
        middleInitials: 'V',
        lastName: 'Bottas'
      });
      expect(result).to.equal('Valtteri V Bottas');
    });

    test('and has a fullName attribute uses the fullName attribute', () => {
      result = contactMapper.mapContactToString({
        type: 'person',
        fullName: 'Valtteri Bottas',
        firstName: 'Valtteri',
        middleInitials: 'V',
        lastName: 'Bottas'
      });
      expect(result).to.equal('Valtteri Bottas');
    });

    test('includes department if present', () => {
      result = contactMapper.mapContactToString({
        type: 'person',
        fullName: 'Valtteri Bottas',
        firstName: 'Valtteri',
        middleInitials: 'V',
        lastName: 'Bottas',
        department: 'Mercedes Petronas AMG'
      });
      expect(result).to.equal('Valtteri Bottas, Mercedes Petronas AMG');
    });
  });
});
