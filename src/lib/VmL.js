const Helpers = require('../lib/helpers')
const View = require('../lib/view')
const CRM = require('./connectors/crm')
const IDM = require('./connectors/idm')
const Permit = require('./connectors/permit')

function getRoot(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Water Abstractions Prototype'
  reply.view('water/index', viewContext)
}

function getSignout(request, reply) {
  request.cookieAuth.clear()
  return reply.redirect('/')
}

function getSignin(request, reply) {
  // get signin page
  if (request.path != '/signin') {
    request.session.postlogin = request.path
  } else {
    request.session.postlogin = '/licences'
  }
  request.session.id = Helpers.createGUID()
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  return reply.view('water/signin', viewContext)
}

function postSignin(request, reply) {
  // post from signin page
  if (request.payload && request.payload.user_id && request.payload.password) {
    IDM.login(request.payload.user_id, request.payload.password).then((getUser) => {
      var session = request.session
      request.session.user = getUser.body
      request.session.username = request.payload.user_id
      request.session.cookie = getUser.sessionCookie
      request.session.licences = getUser.licences
      request.session.id = getUser.body.sessionGUID

      request.cookieAuth.set({
        sid: getUser.sessionGuid
      })
      //TODO: consider post login redirect to other than main licences page
      console.log('getUser.body.reset_required')
      console.log(getUser.body.reset_required)


      if (getUser.body.reset_required && getUser.body.reset_required ==1){
        reply.redirect('reset_password_change_password' + '?resetGuid=' + getUser.body.reset_guid+'&forced=1')
      } else {
        return reply('<script>location.href=\'/licences\'</script>')
      }

    }).catch((getuser) => {
      console.log(getuser)
      if(getuser.statusCode && getuser.statusCode==401){
        var viewContext = View.contextDefaults(request)
        viewContext.payload = request.payload
        viewContext.errors = {}
        viewContext.errors['authentication'] = 1
        viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
        return reply.view('water/signin', viewContext)
      } else {
        var viewContext = View.contextDefaults(request)
        viewContext.pageTitle = 'GOV.UK - Error'
        return reply.view('water/error', viewContext)
      }


    })
  } else {
      console.log('error type 2')
    var viewContext = View.contextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
    viewContext.payload = request.payload
    viewContext.errors = {}
    if (!request.payload.user_id) {
      viewContext.errors['user-id'] = 1
    }

    if (!request.payload.password) {
      viewContext.errors['password'] = 1
    }

    return reply.view('water/signin', viewContext)
  }
}

function getLicences(request, reply) {
  if (!request.session.id) {
    return reply.redirect('/signin')
  } else {
    var viewContext = View.contextDefaults(request)
    CRM.getLicences(request.session.username).then((data) => {
      request.session.licences = data
      viewContext.licenceData = data
      viewContext.debug.licenceData = data
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
      return reply.view('water/licences', viewContext)
    }).catch((data) => {

      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Error'
      return reply.view('water/error', viewContext)

    })
  }
}



function renderLicencePage(view, pageTitle, request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = pageTitle
  if (!viewContext.session.id) {
    getSignin(request, reply)
  } else {
    CRM.getLicenceInternalID(request.session.licences, request.params.licence_id)
      .then((thisLicence) => {
        Permit.getLicence(thisLicence.system_internal_id).then((licence) => {
          data = JSON.parse(licence.body)
          viewContext.licence_id = request.params.licence_id
          viewContext.licenceData = data.data
          viewContext.debug.licenceData = viewContext.licenceData
          return reply.view(view, viewContext)
        }).catch((response) => {
          viewContext.debug.response = response
          viewContext.error = response
          viewContext.error = 'You have requested a licence with an invalid ID'
          return reply.view('water/licence_error', viewContext)
        })
      }).catch((response) => {
        viewContext.debug.response = response
        viewContext.error = response
        return reply.view('water/licence_error', viewContext)
      })
  }
}

function getLicence(request, reply) {
  console.log('render licence page!!!')
  renderLicencePage(
    'water/licence', 'GOV.UK - Your water abstraction licences', request, reply
  )
}

function getLicenceContact(request, reply) {
  renderLicencePage(
    'water/licences_contact', 'GOV.UK - Your water abstraction licences - contact details', request, reply
  )
}

function getLicenceMap(request, reply) {
  renderLicencePage(
    'water/licences_map', 'GOV.UK - Your water abstraction licences - Map', request, reply
  )
}

function getLicenceTerms(request, reply) {
  renderLicencePage(
    'water/licences_terms', 'GOV.UK - Your water abstraction licences - Full Terms', request, reply
  )
}



function getUpdatePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    viewContext.pageTitle = 'GOV.UK - change your password'
    return reply.view('water/update_password', viewContext)
  }
}

function validatePasswordRules(password) {
  var result = {
    hasValidationErrors: false
  }

  if (!/[A-Z]/.test(password)) {
    result.hasValidationErrors = true;
    result.passwordHasNoUpperCase = true;
  }

  if (!/[£!@#\$%\^&\*\?]/.test(password)) {
    result.hasValidationErrors = true;
    result.passwordHasNoSymbol = true;
  }

  if (password.length < 8) {
    result.hasValidationErrors = true;
    result.passwordTooShort = true;
  }

  return result;
}

function validatePassword(password, confirmPassword) {
  if (!password && !confirmPassword) {
    return {
      noPassword: true,
      noConfirmPassword: true
    }
  }

  if (!password) {
    return {
      noPassword: true,
    }
  }

  if (!confirmPassword) {
    return {
      noConfirmPassword: true,
    }
  }

  var passwordValidationFailures = validatePasswordRules(password)
  if (passwordValidationFailures.hasValidationErrors) {
    return passwordValidationFailures;
  }

  if (password != confirmPassword) {
    return {
      passwordsDontMatch: true
    }
  }

  return null;
}

function postUpdatePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - change your password'
  var errors = validatePassword(request.payload.password, request.payload['confirm-password']);
  if (!errors) {
    IDM.updatePassword(viewContext.session.username, request.payload.password).then((res) => {
      var data = JSON.parse(res.data)
      return reply.redirect('licences')
    }).catch(() => {
      return reply.view('water/update_password', viewContext)
    })
  } else {
    viewContext.errors = errors
    return reply.view('water/update_password', viewContext)
  }
}

function getResetPassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password'
  return reply.view('water/reset_password', viewContext)
}

function getResetPasswordCheckEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - check your email'
  return reply.view('water/reset_password_check_email', viewContext)
}

function getResetPasswordResendEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - resend email'
  return reply.view('water/reset_password_resend_email', viewContext)
}

function getResetPasswordResentEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - resent email'
  return reply.view('water/reset_password_resent_email', viewContext)
}

function getResetPasswordLink(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - get link'
  return reply.view('water/reset_password_get_link', viewContext)
}

function getResetPasswordChangePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - update your password'
  viewContext.resetGuid = request.query.resetGuid


  console.log('forced password reset!')
  console.log(request.query.forced)

  if(request.query.forced){

    // show forced reset message
    viewContext.forced=true
  }


  return reply.view('water/reset_password_change_password', viewContext)
}

function validateEmailAddress(emailAddress) {
  // Regex taken from Stack Overflow, we may want to validate this properly at some point
  var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (emailAddress === "" || !emailRegex.test(emailAddress)) {
    return {
      invalidEmailAddress: true
    }
  }

  return null
}

function resetPasswordImpl(request, reply, redirect, title, errorRedirect) {
  var errors = validateEmailAddress(request.payload.email_address);
  if (!errors) {
    IDM.resetPassword(request.payload.email_address).then((res) => {
      return reply.redirect(redirect)
    }).catch((err) => {
      //TODO: generic error handler
    })
  } else {
    var viewContext = View.contextDefaults(request)
    viewContext.pageTitle = title
    viewContext.errors = errors
    viewContext.payload = request.payload
    return reply.view(errorRedirect, viewContext)
  }
}

function postResetPassword(request, reply) {
  resetPasswordImpl(request, reply, 'reset_password_check_email', 'GOV.UK - reset your password', 'water/reset_password')
}

function postResetPasswordResendEmail(request, reply) {
  resetPasswordImpl(request, reply, 'reset_password_resent_email', 'GOV.UK - reset your password - resend email', 'water/reset_password_resend_email')
}

function postResetPasswordLink(request, reply) {
  var errors = validateEmailAddress(request.payload.email_address);
  if (!errors) {
    IDM.getPasswordResetLink(request.payload.email_address).then((data) => {
      data = JSON.parse(data)
      if (data.err) {
        var viewContext = View.contextDefaults(request)
        viewContext.pageTitle = 'Debug page'
        viewContext.errors = {
          noPasswordResetRequest: true
        }
        viewContext.payload = request.payload
        return reply.view('water/reset_password_get_link', viewContext)
      } else {
        return reply.redirect('reset_password_change_password' + '?resetGuid=' + data.reset_guid)
      }
    }).catch((err) => {
      //TODO: generic error page
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'Debug page'
      viewContext.errors = {
        noPasswordResetRequest: true
      }
      return reply.view('water/reset_password_get_link', viewContext)
    })

  } else {
    var viewContext = View.contextDefaults(request)
    viewContext.pageTitle = 'Debug page'
    viewContext.errors = errors
    viewContext.payload = request.payload
    return reply.view('water/reset_password_get_link', viewContext)
  }
}

function postResetPasswordChangePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - update your password'

  var errors = validatePassword(request.payload.password, request.payload['confirm-password']);
  if (!errors) {
    IDM.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password).then((res) => {
      return reply.redirect('signin')
    }).catch((err) => {
      viewContext.errors = err
      viewContext.resetGuid = request.payload.resetGuid
      return reply.view('water/reset_password_change_password', viewContext)
    })
  } else {
    viewContext.errors = errors
    viewContext.resetGuid = request.payload.resetGuid
    return reply.view('water/reset_password_change_password', viewContext)
  }
}

function fourOhFour(request, reply){
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Not Found'
  return reply.view('water/404', viewContext).code(404)
}


module.exports = {
  getRoot: getRoot,
  getSignin: getSignin,
  getSignout: getSignout,
  postSignin: postSignin,
  getLicences: getLicences,
  getLicence: getLicence,
  getLicenceContact: getLicenceContact,
  getLicenceMap: getLicenceMap,
  getLicenceTerms: getLicenceTerms,
  getUpdatePassword: getUpdatePassword,
  postUpdatePassword: postUpdatePassword,
  getResetPassword: getResetPassword,
  postResetPassword: postResetPassword,
  getResetPasswordCheckEmail: getResetPasswordCheckEmail,
  getResetPasswordResendEmail: getResetPasswordResendEmail,
  postResetPasswordResendEmail: postResetPasswordResendEmail,
  getResetPasswordResentEmail: getResetPasswordResentEmail,
  getResetPasswordLink: getResetPasswordLink,
  postResetPasswordLink: postResetPasswordLink,
  getResetPasswordChangePassword: getResetPasswordChangePassword,
  postResetPasswordChangePassword: postResetPasswordChangePassword,
  fourOhFour:fourOhFour
}
