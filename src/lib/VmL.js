const View = require('./view');

function getRoot (request, reply) {
  reply.file('./staticindex.html');
}

function getAccessibility (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Accessibility';
  return reply.view('water/accessibility', viewContext);
}

function getCookies (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Cookies';
  return reply.view('water/cookies', viewContext);
}

function getPrivacyPolicy (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Privacy: how we use your personal information';
  return reply.view('water/privacy_policy', viewContext);
}

function fourOhFour (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = "We can't find that page";
  return reply.view('water/404', viewContext).code(404);
}

function getFeedback (request, reply) {
  var viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Tell us what you think about this service';
  return reply.view('water/feedback', viewContext);
}

// function dashboard (request, reply) {
//   var viewContext = View.contextDefaults(request);
//   viewContext.pageTitle = 'Dashboard';
//   viewContext.activeNavLink = 'dashboard';
//   return reply.view('water/dashboard', viewContext);
// }

function getHoldingPage (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'The test version of this service is now closed';
  return reply.view('water/holding_page', viewContext);
}

module.exports = {
  getRoot,
  getCookies,
  getAccessibility,
  getPrivacyPolicy,
  fourOhFour,
  getFeedback,
  // dashboard,
  getHoldingPage
};
