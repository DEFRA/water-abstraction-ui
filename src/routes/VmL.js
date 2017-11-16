
const VmL=require('../lib/VmL')


/**
Note the workaround for path / to serve static file for root path (so as not to use a view and get extrab headers, footers, etc)
**/

module.exports = [

  {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
          console.log('serve the file!!!')
          var fs = require('fs');
          fs.readFile( __dirname + '/../views/water/index.html', function (err, data) {
            if (err) {
              throw err;
            }
            reply(data.toString());
          });

        }
    },

  { method: 'GET', path: '/robots.txt', handler: function(request,reply){return reply('exterminate').code(200)}, config:{auth: false,description:'Ooh. Robots'}},
  { method: 'GET', path: '/feedback', config: { auth: false }, handler: VmL.getFeedback },
  { method: 'GET', path: '/tmp', config: { auth: false }, handler: VmL.getRoot },
  { method: 'GET', path: '/signout', config: { auth: false }, handler: VmL.getSignout },
  { method: 'GET', path: '/signin', config: { auth: false }, handler: VmL.getSignin },
  { method: 'POST', path: '/signin', config: { auth: false }, handler: VmL.postSignin },
  { method: 'GET', path: '/update_password', handler: VmL.getUpdatePassword },
  { method: 'GET', path: '/password_updated', handler: VmL.getUpdatedPassword },
  { method: 'POST', path: '/update_password', handler: VmL.postUpdatePassword },
  { method: 'GET', path: '/reset_password', config: { auth: false }, handler: VmL.getResetPassword },
  { method: 'POST', path: '/reset_password', config: { auth: false }, handler: VmL.postResetPassword },
  { method: 'GET', path: '/reset_password_check_email', config: { auth: false }, handler: VmL.getResetPasswordCheckEmail },
  { method: 'GET', path: '/reset_password_resend_email', config: { auth: false }, handler: VmL.getResetPasswordResendEmail },
  { method: 'POST', path: '/reset_password_resend_email', config: { auth: false }, handler: VmL.postResetPasswordResendEmail },
  { method: 'GET', path: '/reset_password_resent_email', config: { auth: false }, handler: VmL.getResetPasswordResentEmail },
    { method: 'GET', path: '/reset_password_change_password', config: { auth: false }, handler: VmL.getResetPasswordChangePassword },
  { method: 'POST', path: '/reset_password_change_password', config: { auth: false }, handler: VmL.postResetPasswordChangePassword },
  { method: 'GET', path: '/licences',  handler: VmL.getLicences },
  { method: 'GET', path: '/licences/{licence_id}', handler: VmL.getLicence },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: VmL.getLicenceContact },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: VmL.getLicenceMap },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: VmL.getLicenceTerms },

{
      method: '*',
      path: '/{p*}', // catch-all path
      handler: VmL.fourOhFour
  }

]

/**
{ method: 'GET', path: '/reset_password_get_link', config: { auth: false }, handler: VmL.getResetPasswordLink },
{ method: 'POST', path: '/reset_password_get_link', config: { auth: false }, handler: VmL.postResetPasswordLink },
**/
