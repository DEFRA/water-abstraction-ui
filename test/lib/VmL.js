'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
// const rewire = require('rewire');

const vml = require('../../src/lib/VmL.js');

lab.experiment('vml.getRoot', () => {
  lab.test('function exists', async () => {
    Code.expect(vml.getRoot).to.be.a.function();
  });
});
//
// lab.experiment('vml.getUpdatePassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getUpdatePassword).to.be.a.function();
//   });
// });
// lab.experiment('vml.postUpdatePassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.postUpdatePassword).to.be.a.function();
//   });
// });
// lab.experiment('vml.getResetPassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getResetPassword).to.be.a.function();
//   });
// });
// lab.experiment('vml.postResetPassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.postResetPassword).to.be.a.function();
//   });
// });
// lab.experiment('vml.getResetPasswordCheckEmail', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getResetPasswordCheckEmail).to.be.a.function();
//   });
// });
// lab.experiment('vml.getResetPasswordResendEmail', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getResetPasswordResendEmail).to.be.a.function();
//   });
// });
// lab.experiment('vml.postResetPasswordResendEmail', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.postResetPasswordResendEmail).to.be.a.function();
//   });
// });
// lab.experiment('vml.getResetPasswordResentEmail', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getResetPasswordResentEmail).to.be.a.function();
//   });
// });
// lab.experiment('vml.getResetPasswordLink', () => {
//   lab.test('function exists', async () => {
//   Code.expect(vml.getResetPasswordLink).to.be.a.function()
// })
// })
// lab.experiment('vml.postResetPasswordLink', () => {
//   lab.test('function exists', async () => {
//   Code.expect(vml.postResetPasswordLink).to.be.a.function()
// })
// })
// lab.experiment('vml.getResetPasswordChangePassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.getResetPasswordChangePassword).to.be.a.function();
//   });
// });
// lab.experiment('vml.postResetPasswordChangePassword', () => {
//   lab.test('function exists', async () => {
//     Code.expect(vml.postResetPasswordChangePassword).to.be.a.function();
//   });
// });
lab.experiment('vml.fourOhFour', () => {
  lab.test('function exists', async () => {
    Code.expect(vml.fourOhFour).to.be.a.function();
  });
});

// lab.experiment('vml.getSignin', () => {
//   var request={path:'/signin',session:{},connection:{info:''},info:{}}
//   var reply={view:function(){return true}}
//   lab.test('returns true', async () => {
//   Code.expect(vml.getSignin(request,reply)).to.be.equal(true)
// })
// })
