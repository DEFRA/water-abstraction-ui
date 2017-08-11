
const Helpers = require('../helpers')
const User = require('../user')
const View = require('../view')
const Session = require('../session')











function getRoot (request, reply) {
  var viewContext = View.getViewContextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Water Abstractions Prototype'
  reply.view('water/index', viewContext)
}

function getSignin (request, reply) {
  console.log('Requested Path')
  console.log(request.path)
  if(request.path != '/signin'){
    request.yar.set('postlogin',request.path)
  } else {
    request.yar.set('postlogin','/licences')
  }
  Session.set(request, {id: Helpers.createGUID()})
  var viewContext = View.getViewContextDefaults(request)
  viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
  reply.view('water/signin', viewContext)
}

function postSignin (request, reply) {
  if (request.payload && request.payload.user_id && request.payload.password) {
    var getUser = User.authenticate(request.payload.user_id, request.payload.password)
    console.log(getUser)
    if (getUser.status) {
      var session = Session.get(request)
      session.user = getUser.user
      Session.set(request, session)

//      request.session.user = getUser.user
      console.log('redirect to licences page')
      reply('<script>location.href=\''+request.yar.get('postlogin')+'\'</script>')
      /**
      var httpRequest = require('request')
      httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/licences', function (error, response, body) {
        var viewContext = View.getViewContextDefaults(request)
        viewContext.licenceData = JSON.parse(body)
        viewContext.licence = body
        viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
        reply.view('water/licences', viewContext)
      })
      **/
    } else {
      var viewContext = View.getViewContextDefaults(request)
      viewContext.payload = request.payload
      viewContext.errors = {}
      viewContext.errors['authentication'] = 1
      viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
      reply.view('water/signin', viewContext)
    }
  } else {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.pageTitle = 'GOV.UK - Sign in to view your licence'
    viewContext.payload = request.payload
    viewContext.errors = {}
//    viewContext.errors['password']=1;

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
  var viewContext = View.getViewContextDefaults(request)
  var httpRequest = require('request')

  var user = viewContext.session.user

  if (!user) {
    console.log('where has my session gone!!!')
    getSignin(request, reply)
  } else {
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/org/1/licencetype/1/licence', function (error, response, body) {
      var viewContext = View.getViewContextDefaults(request)

      try {
        viewContext.licenceData = JSON.parse(body)
        console.log(viewContext.licenceData)
        viewContext.licence = body

      } catch (e) {
        ;
      }
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'
      reply.view('water/licences', viewContext)
    })
  }
}

function getLicence (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.getViewContextDefaults(request)
  console.log(request.session)

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/API/1.0/org/1/licencetype/1/licence/' + request.params.licence_id + '', function (error, response, body) {
      var viewContext = View.getViewContextDefaults(request)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      console.log('got licence?')
      console.log(viewContext.licenceData)
      viewContext.licence = JSON.parse(body)
      viewContext.debug.licence = JSON.parse(body)
      viewContext.pageTitle = 'GOV.UK - ' + viewContext.licenceData.LicenceName + ' water abstraction licence'
      reply.view('water/licence', viewContext)
    })
  }
}

function getLicenceContact (request, reply) {
  var viewContext = View.getViewContextDefaults(request)
  var httpRequest = require('request')

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = View.getViewContextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - contact details'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_contact', viewContext)
    })
  }
}

function getLicenceMap (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.getViewContextDefaults(request)
  console.log(request.session)

  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = View.getViewContextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - abstraction point'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_map', viewContext)
    })
  }
}

function getLicenceTerms (request, reply) {
  var httpRequest = require('request')
  var viewContext = View.getViewContextDefaults(request)
  if (!viewContext.session.user) {
    getSignin(request, reply)
  } else {
    httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + request.params.licence_id + '.json', function (error, response, body) {
      var viewContext = View.getViewContextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licence - Full Terms'
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = JSON.parse(body)
      viewContext.licence = body
      reply.view('water/licences_terms', viewContext)
    })
  }
}

function getTest (request, reply) {
  var httpRequest = require('request')
  httpRequest(request.connection.info.protocol + '://' + request.info.host + '/public/data/licences/' + 1 + '.json', function (error, response, body) {
    var viewContext = View.getViewContextDefaults(request)
    viewContext.title = 'Your water abstraction licence - Full Terms'
    viewContext.pageTitle = 'GOV.UK - ' + viewContext.title
    viewContext.breadcrumbs = []

    viewContext.licence_id = 1
    viewContext.licenceData = JSON.parse(body)
    viewContext.licence = body
    console.log(viewContext.licence)

    viewContext.layoutData = [
      {
        'attributeElementType': 'textRow',
        'attributeValue': 'Licence Holder:',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.FirstName
          },
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.Surname
          },
          {
            'attributeElementType': 'br'
          },
          {
            'attributeElementType': 'link',
            'attributeValue': '/contact',
            'attributeChildren': [
              {
                'attributeElementType': 'textValue',
                'attributeValue': 'Licence Contact Details'
              }]
          }
        ]},
      {
        'attributeElementType': 'textRow',
        'attributeValue': 'Point of Abstraction:',
        'attributeChildren': [
          {
            'attributeElementType': 'dataValue',
            'attributeValue': 'Pointofabstraction'
          },
          {
            'attributeElementType': 'br'
          },
          {
            'attributeElementType': 'link',
            'attributeValue': '/map_of_abstraction_point',
            'attributeChildren': [
              {
                'attributeElementType': 'textValue',
                'attributeValue': 'View Map'
              }]
          }
        ]},
      {
        'attributeElementType': 'textRow',
        'attributeValue': 'Licence effective from:',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.EffectiveDateStart
          }
        ]
      },
      {
        'attributeElementType': 'textRow',
        'attributeValue': 'Licenced until:',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.EffectiveDateend
          }
        ]
      }, {
        'attributeElementType': 'textRow',
        'attributeValue': 'Source of supply:',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.SourceofSupply
          }
        ]
      }, {
        'attributeElementType': 'textRow',
        'attributeValue': 'Period of abstraction:',
        'attributeChildren': [
          {
            'attributeElementType': 'dataValue',
            'attributeValue': 'PeriodofAbstraction'
          }
        ]
      }, {
        'attributeElementType': 'textRow',
        'attributeValue': 'Flow Conditions:',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': 'This licence has '
          },
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.handsOffFlow
          },
          {
            'attributeElementType': 'hidden',
            'attributeValue': viewContext.licenceData.handsOffFlowHelp,
            'attributeChildren': [
              {
                'attributeElementType': 'textValue',
                'attributeValue': '<h3 class="heading-small">What is a flow condition?</h3><p>A licence condition which applies to some water abstraction licences, to protect our water levels in times of low surface water supply.</p><p>A flow condition will affect the licensed maximum amount you can abstract.</p>'
              }

            ]
          }
        ]
      }, {
        'attributeElementType': 'textRow',
        'attributeValue': 'Maximum quantities before conditions',
        'attributeChildren': [
          {
            'attributeElementType': 'textValue',
            'attributeValue': viewContext.licenceData.MaximumQuantityofwatertobeabstracted
          }
        ]
      },

      {
        'attributeRef': 'ABSLink',
        'attributeElementType': 'link',
        'attributeValue': '/terms',
        'attributeChildren': [
          {
            'attributeRef': 'linkText',
            'attributeElementType': 'textValue',
            'attributeValue': 'Read your full licence terms of use'
          }]
      },
      {
        'attributeRef': 'accordion1',
        'attributeElementType': 'accordion',
        'attributeValue': '',
        'attributeChildren': [
          {
            'attributeRef': 'ex1',
            'attributeElementType': 'accordionItem',
            'attributeValue': 'An accordionItem',
            'attributeChildren': [
              {
                'attributeRef': 'ex1text',
                'attributeElementType': 'textValue',
                'attributeValue': 'Hello'
              }
            ]
          }
        ]
      }

    ]

    viewContext.breadcrumbs.push({'title': 'Your services', 'uri': '/'})
    viewContext.breadcrumbs.push({'title': 'Abstraction licences', 'uri': '/licences'})
    viewContext.breadcrumbs.push({'title': 'Licence number: ' + viewContext.licenceData.LicenceSerialNo, 'uri': '/licences/' + viewContext.licence_id})

    reply.view('water/test', viewContext)
  })
}

module.exports = [

  { method: 'GET', path: '/', handler: getRoot },
  { method: 'GET', path: '/signin', handler: getSignin },
  { method: 'POST', path: '/signin', handler: postSignin },
  { method: 'GET', path: '/licences', handler: getLicences },
  { method: 'GET', path: '/licences/{licence_id}', handler: getLicence },
  { method: 'GET', path: '/licences/{licence_id}/contact', handler: getLicenceContact },
  { method: 'GET', path: '/licences/{licence_id}/map_of_abstraction_point', handler: getLicenceMap },
  { method: 'GET', path: '/licences/{licence_id}/terms', handler: getLicenceTerms },

  { method: 'GET', path: '/test', handler: getTest }
]
