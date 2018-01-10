
const VmL=require('../lib/VmL')
const Joi = require('joi');

const LicencesController = require('../controllers/licences');
const AuthController = require('../controllers/authentication');
const RegistrationController = require('../controllers/registration');
const LicencesAddController = require('../controllers/licences-add');

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
  { method: 'GET', path: '/signout', config: { auth: false }, handler: AuthController.getSignout },
  { method: 'GET', path: '/signin', handler: AuthController.getSignin, config: { auth: false,
    validate : {
      query : {
        flash : Joi.string().max(32)
      }
    }
  } },
  { method: 'POST', path: '/signin', handler: AuthController.postSignin, config : {
    description : 'Login form handler',
    auth : false,
    validate : {
      payload : {
        user_id : Joi.string(),
        password: Joi.string()
      }
    }
  }},
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

  { method: 'GET', path: '/create-password', handler: VmL.getCreatePassword, config: {
    auth: false,
    validate : {
      query : {
        resetGuid : Joi.string().guid().required()
      }
    }}},


  { method: 'POST', path: '/create-password', config: { auth: false }, handler: VmL.postCreatePassword },



  { method: 'GET', path: '/licences',  handler: LicencesController.getLicences, config: {
    description : 'View list of licences with facility to sort/filter',
    validate: {
         query: {
             sort: Joi.string().valid('licenceNumber', 'name'),
             direction : Joi.number().valid(1, -1),
             emailAddress : Joi.string().allow(''),
             licenceNumber : Joi.string().allow('')
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

  { method: 'GET', path: '/licences/{licence_id}/conditions', handler: LicencesController.getLicenceConditions, config : {
    description : 'View abstraction conditions info for licence',
    validate : {
      params : {
        licence_id : Joi.string().required().guid()
      }
    }
  } },

  { method: 'GET', path: '/licences/{licence_id}/rename', handler: LicencesController.getLicenceRename, config : {
    description : 'Set user-defined name for licence',
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
  }},


  // Registration process
  { method: 'GET', path: '/register', handler: RegistrationController.getEmailAddress, config : {
    auth : false,
    description : 'Register user account - get email address'
  }},
  { method: 'POST', path: '/register', handler: RegistrationController.postEmailAddress, config : {
    auth : false,
    description : 'Register user account - email address form handler',
    validate : {
      payload : {
        email : Joi.string().allow('')
      }
    }
  }},
  { method: 'GET', path: '/success', handler: RegistrationController.getRegisterSuccess, config : {
    auth : false,
    description : 'Register user account - success page'
  }},
  { method: 'GET', path: '/send-again', handler: RegistrationController.getSendAgain, config : {
    auth : false,
    description: 'Register user account - resend email form'
  }},
  { method: 'POST', path: '/send-again', handler: RegistrationController.postSendAgain, config : {
    auth : false,
    description : 'Register user account - resend email address form handler',
    validate : {
      payload : {
        email : Joi.string().allow('')
      }
    }
  }},
  { method: 'GET', path: '/resent-success', handler: RegistrationController.getResentSuccess, config : {
    auth : false,
    description : 'Register user account - email resent success page'
  }},

  // Manage licences
  { method: 'GET', path: '/manage_licences', handler: LicencesController.getAccessList, config : {
    description : 'Manage licences - main page'
  }},
  { method: 'GET', path: '/manage_licences/remove_access', handler: LicencesController.getRemoveAccess, config : {
    description : 'Manage licences - remove access form'
  }},
  { method: 'GET', path: '/manage_licences/add_access', handler: LicencesController.getAddAccess, config : {
    description : 'Manage licences - add access form'
  }},
  { method: 'POST', path: '/manage_licences/add_access', handler: LicencesController.postAddAccess, config : {
    description : 'Managfe licences - add access process'
  }},

  // Add licence to account
  { method: 'GET', path: '/add-licences', handler: LicencesAddController.getLicenceAdd, config : {
    description : 'Start flow to add licences'
  }},
  { method: 'POST', path: '/add-licences', handler: LicencesAddController.postLicenceAdd, config : {
    description : 'Start flow to add licences',
    validate : {
      payload : {
        licence_no : Joi.string().allow('')
      }
    }
  }},

  // Select licences
  { method : 'GET', path : '/select-licences', handler: LicencesAddController.getLicenceSelect, config : {
    description : 'Select the licences to add',
    validate : {
      query : {
        token : Joi.string().required(),
        error : Joi.string()
      }
    }
  }},
  { method: 'POST', path: '/select-licences', handler: LicencesAddController.postLicenceSelect, config : {
    description : 'Post handler for licence select',
    validate : {
      payload : {
        token : Joi.string().required(),
        licences : [Joi.array(), Joi.string().allow('')]
      }
    }
  }},
  { method : 'GET', path : '/select-licences-error', handler: LicencesAddController.getLicenceSelectError, config : {
    description : 'Error uploading licences - show contact information'
  }},


  { method : 'GET', path : '/select-address', handler: LicencesAddController.getAddressSelect, config : {
    description : 'Select the address to send postal verification letter',
    validate : {
      query : {
        token : Joi.string().required(),
        error : Joi.string().allow('')
      }
    }
  }},

  { method : 'POST', path : '/select-address', handler: LicencesAddController.postAddressSelect, config : {
    description : 'Post handler for select address form',
    validate : {
      payload : {
        address : Joi.string(),
        token : Joi.string().required()
      }
    }
  }},

  // { method: 'POST', path: '/confirm-licences', handler: LicencesAddController.postConfirmLicences, config : {
  //   description : 'Confirm licences to add to account',
  //   validate : {
  //     payload : {
  //       token : Joi.string().required(),
  //       address : Joi.string().guid()
  //     }
  //   }
  // }},


  // {
  //   method: 'POST', path : '/confirm-address', handler: LicencesAddController.postConfirmAddress, config : {
  //     description : 'Select address for verification',
  //     validate : {
  //       payload : {
  //         token : Joi.string().required(),
  //         licences : [Joi.array(), Joi.string()]
  //       }
  //     }
  //   }
  // },
  { method: 'GET', path: '/security-code', handler: LicencesAddController.getSecurityCode, config : {
    description : 'Enter auth code received by post'
  }},
  { method: 'POST', path: '/security-code', handler: LicencesAddController.postSecurityCode, config : {
    description : 'Enter auth code received by post',
    validate : {
      payload : {
        verification_code : Joi.string()
      }
    }
  }},




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
