'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const controller = require('../../../src/modules/reset-password/controller');

/**
 * Note current version test of 'code' can't test for async function
 * @see {@link https://github.com/hapijs/code/issues/103}
 */
function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction';
}

lab.experiment('Check methods on reset password controller', () => {
  lab.test('getResetPassword function exists', async () => {
    Code.expect(isAsync(controller.getResetPassword)).to.equal(true);
  });

  lab.test('postResetPassword function exists', async () => {
    Code.expect(isAsync(controller.postResetPassword)).to.equal(true);
  });

  lab.test('getResetSuccess function exists', async () => {
    Code.expect(isAsync(controller.getResetSuccess)).to.equal(true);
  });

  lab.test('getChangePassword function exists', async () => {
    Code.expect(isAsync(controller.getChangePassword)).to.equal(true);
  });

  lab.test('postChangePassword function exists', async () => {
    Code.expect(isAsync(controller.postChangePassword)).to.equal(true);
  });
});
