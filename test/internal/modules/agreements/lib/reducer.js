'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { reducer } = require('internal/modules/agreements/lib/reducer');
const actions = require('internal/modules/agreements/lib/actions');

experiment('internal/modules/agreements/lib/reducer', () => {
  let request;

  beforeEach(async () => {
    request = {
      pre: {
        licence: {
          startDate: '2019-01-01'
        }
      }
    };
  });

  experiment('.setAgreementType', () => {
    test('sets the financial agreement code', async () => {
      const nextState = reducer({}, actions.setAgreementType(request, { financialAgreementCode: 'S127' }));
      expect(nextState).to.equal({
        code: 'S127'
      });
    });
  });

  experiment('.setDateSigned', () => {
    test('sets the date signed to the provided date, if is date signed known is true', async () => {
      const nextState = reducer({ code: 'S127' }, actions.setDateSigned(request, { isDateSignedKnown: true, dateSigned: '2020-05-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: '2020-05-01',
        isDateSignedKnown: true,
        startDate: '2020-04-01'
      });
    });

    test('sets the date signed to undefined, if is date signed known is false', async () => {
      const nextState = reducer({ code: 'S127' }, actions.setDateSigned(request, { isDateSignedKnown: false, dateSigned: '2020-05-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: undefined,
        isDateSignedKnown: false,
        startDate: '2020-04-01'
      });
    });

    test('sets the start date to the start of the financial year, if later than the licence start date', async () => {
      const nextState = reducer({ code: 'S127' }, actions.setDateSigned(request, { isDateSignedKnown: true, dateSigned: '2020-05-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: '2020-05-01',
        isDateSignedKnown: true,
        startDate: '2020-04-01'
      });
    });

    test('sets the start date to the licence start date, if later than the financial year start date', async () => {
      const nextState = reducer({ code: 'S127' }, actions.setDateSigned(request, { isDateSignedKnown: true, dateSigned: '2019-02-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: '2019-02-01',
        isDateSignedKnown: true,
        startDate: '2019-01-01'
      });
    });
  });

  experiment('.setStartDate', () => {
    test('sets a custom start date', async () => {
      const nextState = reducer({ code: 'S127', isDateSignedKnown: true, dateSigned: '2019-01-01' }, actions.setStartDate(request, { isCustomStartDate: true, startDate: '2020-05-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: '2019-01-01',
        isDateSignedKnown: true,
        startDate: '2020-05-01'
      });
    });

    test('does not change the start date if custom start date not specified', async () => {
      const nextState = reducer({ code: 'S127', isDateSignedKnown: true, dateSigned: '2019-01-01', startDate: '2018-04-01' }, actions.setStartDate(request, { isCustomStartDate: false, startDate: '2020-05-01' }));
      expect(nextState).to.equal({
        code: 'S127',
        dateSigned: '2019-01-01',
        isDateSignedKnown: true,
        startDate: '2018-04-01'
      });
    });
  });
});
