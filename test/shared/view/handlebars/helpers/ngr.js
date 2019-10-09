const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ngr = require('../../../../../src/shared/view/handlebars/helpers/ngr');

experiment('shared/lib/view-engine/handlebars/helpers/ngr', () => {
  experiment('ngrPoint', () => {
    test('returns null for undefined points', async () => {
      expect(ngr.ngrPoint()).to.be.null();
    });

    experiment('when the point has ngr4', () => {
      test('but no name the expected string is returned', async () => {
        const points = {
          ngr1: '111111',
          ngr2: '222222',
          ngr3: '333333',
          ngr4: '444444'
        };

        const expected = 'Within the area formed by the straight lines running between National Grid References 11 11 11, 22 22 22, 33 33 33 and 44 44 44';

        expect(ngr.ngrPoint(points)).to.equal(expected);
      });

      test('and a name the expected string is returned', async () => {
        const points = {
          name: 'test-name',
          ngr1: '111111',
          ngr2: '222222',
          ngr3: '333333',
          ngr4: '444444'
        };

        const expected = 'Within the area formed by the straight lines running between National Grid References 11 11 11, 22 22 22, 33 33 33 and 44 44 44 (test-name)';

        expect(ngr.ngrPoint(points)).to.equal(expected);
      });
    });

    experiment('when the point has ngr2', () => {
      test('but no name the expected string is returned', async () => {
        const points = {
          ngr1: '111111',
          ngr2: '222222'
        };

        const expected = 'Between National Grid References 11 11 11 and 22 22 22';
        expect(ngr.ngrPoint(points)).to.equal(expected);
      });

      test('and a name the expected string is returned', async () => {
        const points = {
          name: 'test-name',
          ngr1: '111111',
          ngr2: '222222'
        };

        const expected = 'Between National Grid References 11 11 11 and 22 22 22 (test-name)';
        expect(ngr.ngrPoint(points)).to.equal(expected);
      });
    });

    experiment('when the point has only ngr1', () => {
      test('but no name the expected string is returned', async () => {
        const points = {
          ngr1: '111111'
        };

        const expected = 'At National Grid Reference 11 11 11';
        expect(ngr.ngrPoint(points)).to.equal(expected);
      });

      test('and a name the expected string is returned', async () => {
        const points = {
          name: 'test-name',
          ngr1: '111111'
        };

        const expected = 'At National Grid Reference 11 11 11 (test-name)';
        expect(ngr.ngrPoint(points)).to.equal(expected);
      });
    });
  });
});
