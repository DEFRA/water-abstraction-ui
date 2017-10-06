const Helpers = require('../lib/helpers')
const User = require('../lib/user')
const View = require('../lib/view')
const Session = require('../lib/session')
const API = require('../lib/API')

function getRoot (request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Water Abstractions Prototype'
  reply.view('water/index', viewContext)
}

function getSignout (request, reply) {
  request.cookieAuth.clear()
  return reply.redirect('/')
}

function getSignin (request, reply) {
  // get signin page

  if (request.path != '/signin') {
    request.session.postlogin = request.path
  } else {
    request.session.postlogin = '/licences'
  }
  console.log('postlogin set to ' + request.session.postlogin)
  request.session.id = Helpers.createGUID()
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  reply.view('water/signin', viewContext)
}

function postSignin (request, reply) {
  // post from signin page
  if (request.payload && request.payload.user_id && request.payload.password) {
    User.authenticate(request.payload.user_id, request.payload.password, (getUser) => {
      var data = JSON.parse(getUser.data)
      if (!data.error) {
        console.log('user login success')

        var session = request.session

        var getUser = JSON.parse(getUser.data)
        console.log('postlogin get as ' + request.session.postlogin)
        request.session.user = getUser.sessionGuid
        request.session.username = request.payload.user_id
        request.session.cookie = getUser.sessionCookie
        request.session.licences = getUser.licences

        request.cookieAuth.set({ sid: getUser.sessionGuid })
        return reply.redirect(request.session.postlogin)
      } else {
        console.log('user login failure')
        var viewContext = View.contextDefaults(request)
        viewContext.payload = request.payload
        viewContext.errors = {}
        viewContext.errors['authentication'] = 1
        viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
        reply.view('water/signin', viewContext)
      }
    })
  } else {
    console.log('incomplete form data for login')
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

    reply.view('water/signin', viewContext)
  }
}

function getLicences (request, reply) {

  if(!request.session.user){
      return reply.redirect('/signin')
  } else {
    // get licences for user
    var viewContext = View.contextDefaults(request)

    console.log('get licences')
    console.log(request.session)
    console.log(request.session.user)
    console.log(request.session.licences)

    if (request.session.licences) {
      viewContext.licenceData = request.session.licences.data
    } else {
      viewContext.licenceData = []
    }

    viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
    reply.view('water/licences', viewContext)
  }


}

function verifyUserLicenceAccess (licence_id, licences, cb) {
  console.log('------------Params ->')
  console.log(licence_id)
  var canAccessLicence = false
  for (licence in licences) {
    if (licence_id == licences[licence].licence_id) {
      canAccessLicence = true
    }
    console.log(licences[licence].licence_id)
  }
  cb(canAccessLicence)
}

function renderLicencePage (view, pageTitle, request, reply) {
  var viewContext = View.contextDefaults(request)
  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    request.params.orgId = process.env.licenceOrgId
    request.params.typeId = process.env.licenceTypeId
    viewContext.pageTitle = pageTitle
    verifyUserLicenceAccess(request.params.licence_id, request.session.licences.data, (access) => {
      console.log('access: ' + access)
      API.licence.get(request, reply, (data) => {
        if (data.error) { // licence not found
          viewContext.error = data.error
          viewContext.error = 'You have requested a licence with an invalid ID'
          reply.view('water/licence_error', viewContext)
        } else if (!access) { // licence not available for current user
          viewContext.error = 'You are not authorised to view this licence'
          console.log(viewContext.error)
          reply.view('water/licence_error', viewContext)
        } else {
          viewContext.licenceData = data.data
          viewContext.debug.licenceData = viewContext.licenceData
          reply.view(view, viewContext)
        }
      })
    })
  }
}


function getLicence (request, reply) {
  renderLicencePage(
    'water/licence', 'GOV.UK - Your water abstraction licences', request, reply
  )
}

function getLicenceContact (request, reply) {
  renderLicencePage(
    'water/licences_contact', 'GOV.UK - Your water abstraction licences - contact details', request, reply
  )
}

function getLicenceMap (request, reply) {
  renderLicencePage(
    'water/licences_map', 'GOV.UK - Your water abstraction licences - Map', request, reply
  )
}

function getLicenceTerms (request, reply) {
  renderLicencePage(
    'water/licences_terms', 'GOV.UK - Your water abstraction licences - Full Terms', request, reply
  )
}

function useShortcode (request, reply) {
  console.log('got shortcode requests')

  API.user.useShortcode(request.params.shortcode, request.session.cookie, (res) => {
    console.log('response from user shortcode')
//    console.log(response)
    console.log(res)
    var data = JSON.parse(res.data)
    console.log(data)
    if (data.error) {
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - register licence error ' + data.error

      reply.view('water/shortcode_used_error', viewContext)
    } else {
      var viewContext = View.contextDefaults(request)
      viewContext.licence_id = res.data[0].licence_id

      viewContext.pageTitle = 'GOV.UK - register licence'
      reply.view('water/shortcode_use_success', viewContext)
    }
  })
}

function getUpdatePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    viewContext.pageTitle = 'GOV.UK - change your password'
    reply.view('water/update_password', viewContext)
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
  if(!password && !confirmPassword) {
    return {
      noPassword: true,
      noConfirmPassword: true
    }
  }

  if(!password) {
    return {
      noPassword: true,
    }
  }

  if(!confirmPassword) {
    return {
      noConfirmPassword: true,
    }
  }

  var passwordValidationFailures = validatePasswordRules(password)
  if(passwordValidationFailures.hasValidationErrors) {
    return passwordValidationFailures;
  }

  if(password != confirmPassword) {
    return {
      passwordsDontMatch: true
    }
  }

  return null;
}

function postUpdatePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - change your password'

  console.log('Update password request: ' + request.payload.password + ' ' + request.payload['confirm-password'])
  var errors = validatePassword(request.payload.password, request.payload['confirm-password']);
  if (!errors) {
    API.user.updatePassword(viewContext.session.username, request.payload.password, (res) => {
      var data = JSON.parse(res.data)

      if (data.error) {
        reply.view('water/update_password', viewContext)
      } else {
        reply.redirect('licences')
      }
    })
  } else {
    console.log('incorrect form data for password change')
    viewContext.errors = errors
    reply.view('water/update_password', viewContext)
  }
}

function getResetPassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password'
  reply.view('water/reset_password', viewContext)
}

function getResetPasswordCheckEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - check your email'
  reply.view('water/reset_password_check_email', viewContext)
}

function getResetPasswordResendEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - resend email'
  reply.view('water/reset_password_resend_email', viewContext)
}

function getResetPasswordResentEmail(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - resent email'
  reply.view('water/reset_password_resent_email', viewContext)
}

function getResetPasswordLink(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - reset your password - get link'
  reply.view('water/reset_password_get_link', viewContext)
}

function getResetPasswordChangePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - update your password'
  viewContext.resetGuid = request.query.resetGuid
  reply.view('water/reset_password_change_password', viewContext)
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
    console.log('Reset password request: ' + request.payload.email_address)
    var errors = validateEmailAddress(request.payload.email_address);
    if (!errors) {
      API.user.resetPassword(request.payload.email_address, (res) => {
        reply.redirect(redirect)
      })
    } else {
      console.log('incorrect form data for password reset')
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = title
      viewContext.errors = errors
      viewContext.payload = request.payload
      reply.view(errorRedirect, viewContext)
    }
}

function postResetPassword(request, reply) {
  resetPasswordImpl(request, reply, 'reset_password_check_email', 'GOV.UK - reset your password', 'water/reset_password')
}

function postResetPasswordResendEmail(request, reply) {
  resetPasswordImpl(request, reply, 'reset_password_resent_email', 'GOV.UK - reset your password - resend email', 'water/reset_password_resend_email')
}

function postResetPasswordLink(request, reply) {
    console.log('Get password reset link: ' + request.payload.email_address)
    var errors = validateEmailAddress(request.payload.email_address);
    if (!errors) {
      API.user.getPasswordResetLink(request.payload.email_address, (data) => {
        console.log(data)

        if(data.err) {
          var viewContext = View.contextDefaults(request)
          viewContext.pageTitle = 'Debug page'
          viewContext.errors = { noPasswordResetRequest: true }
          viewContext.payload = request.payload
          reply.view('water/reset_password_get_link', viewContext)
        } else {
          reply.redirect('reset_password_change_password' + '?resetGuid=' + data.reset_guid)
        }
      })
    } else {
      console.log('incorrect form data for password reset get link')
      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'Debug page'
      viewContext.errors = errors
      viewContext.payload = request.payload
      reply.view('water/reset_password_get_link', viewContext)
    }
}

function postResetPasswordChangePassword(request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - update your password'

  console.log('Reset update password request: ' + request.payload.password + ' ' + request.payload['confirm-password'] + ' ' + request.payload.resetGuid)
  var errors = validatePassword(request.payload.password, request.payload['confirm-password']);
  if (!errors) {
    API.user.updatePasswordWithGuid(request.payload.resetGuid, request.payload.password, (res) => {
      var data = JSON.parse(res.data)

      if (data.error) {
        reply.view('water/reset_password_change_password', viewContext)
      } else {
        reply.redirect('signin')
      }
    })
  } else {
    viewContext.errors = errors
    reply.view('water/reset_password_change_password', viewContext)
  }
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
  useShortcode: useShortcode,
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
  postResetPasswordChangePassword: postResetPasswordChangePassword
}
