
const VmL=require('../lib/VmL')
const Joi = require('joi');

const LicencesController = require('../controllers/licences');

/**
Note the workaround for path / to serve static file for root path (so as not to use a view and get extrab headers, footers, etc)
**/

module.exports = [

  {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
          console.log(request.query)
          if(request.query.access && request.query.access=='PB01'){
            var fs = require('fs');
            fs.readFile( __dirname + '/../views/water/index.html', function (err, data) {
              if (err) {
                throw err;
              }
              reply(data.toString());
            });
          } else {
              reply('unauthorised').code(401)
          }


        },config: { auth: false },config: { auth: false }
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
  { method: 'GET', path: '/licences',  handler: LicencesController.getLicences, config: {
    description : 'View list of licences with facility to sort/filter',
    validate: {
         query: {
             sort: Joi.string().valid('licenceNumber', 'name'),
             direction : Joi.number().valid(1, -1),
             emailAddress : Joi.string(),
             licenceNumber : Joi.string()
         }
     }
  }},
  { method: 'GET', path: '/licences/{licence_id}', handler: LicencesController.getLicence, config : {
    description : 'View a single licence',
    validate : {
      params : {
        licence_id : Joi.string().required().guid()
      }
    }
 }},
  { method: 'POST', path: '/licences/{licence_id}', handler: LicencesController.postLicence, config : {
      description : 'Update the user-defined licence name',
      validate : {
        params : {
          licence_id : Joi.string().required().guid()
        },
        payload : {
          name : Joi.string()
        }
      }
  }},

  { method: 'GET', path: '/licences/{licence_id}/contact', handler: LicencesController.getLicenceContact, config : {
    description : 'View contact info for licence',
    validate : {
      params : {
        licence_id : Joi.string().required().guid()
      }
    }
  } },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: LicencesController.getLicenceMap, config : {
    description : 'View abstraction point map for licence',
    validate : {
      params : {
        licence_id : Joi.string().required().guid()
      }
    }
  }},
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: LicencesController.getLicenceTerms, config : {
    description : 'View abstraction point terms for licence',
    validate : {
      params : {
        licence_id : Joi.string().required().guid()
      }
    }
  } },

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
