const Helpers = require('../lib/helpers')
const View = require('../lib/view')
const CRM = require('./connectors/crm')
const IDM = require('./connectors/idm')
const Water = require('./connectors/water')
const Permit = require('./connectors/permit')

function getRoot(request, reply) {
  reply.file('./staticindex.html')
}

function getUpdatePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  if (!request.auth.credentials) {
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

  if (!/[^a-zA-Z\d\s]/.test(password)) {
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
  console.log('confirm password')
  console.log(password)
  console.log(confirmPassword)
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
    console.log('Passwords dont match!')
    console.log(password)
    console.log(confirmPassword)
    return {
      passwordsDontMatch: true
    }
  } else {
    console.log('Passwords  match!')
    console.log(password)
    console.log(confirmPassword)

  }

  return null;
}

function postUpdatePassword(request, reply) {
  console.log('*****postUpdatePassword*****')
  console.log('request.payload')
  console.log(request.payload)
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - change your password'
  var errors = validatePassword(request.payload.password, request.payload['confirm-password']);
  console.log(errors)
  if (!errors) {
    IDM.updatePassword(viewContext.session.username, request.payload.password).then((res) => {
      console.log('password updated')
      return reply.redirect('password_updated')
    }).catch(() => {
      return reply.view('water/update_password', viewContext)
    })
  } else {
    viewContext.errors = errors
    viewContext.debug.errors = errors
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



  if (request.query.forced) {

    // show forced reset message
    viewContext.forced = true
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
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Error'
      return reply.view('water/error', viewContext)
    })
  } else {
    var viewContext = View.contextDefaults(request)
    console.log(errors)
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

function fourOhFour(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Not Found'
  return reply.view('water/404', viewContext).code(404)
}

function getFeedback(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Tell us what you think about this service'
  return reply.view('water/feedback', viewContext)
}

function getUpdatedPassword(request,reply){
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Password Updated'
  return reply.view('water/updated_password', viewContext)
}

module.exports = {
  getRoot: getRoot,
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
  fourOhFour: fourOhFour,
  getFeedback:getFeedback,
  getUpdatedPassword:getUpdatedPassword
}
