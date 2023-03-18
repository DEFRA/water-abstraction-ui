'use strict'

const querystring = require('querystring');

Cypress.Commands.add('getPasswordResetUrl', (baseUrl, email) => {
  cy.request({
    url: `${Cypress.env('ADMIN_URI')}notifications/last?${querystring.encode({ email })}`,
    log: false,
    method: 'GET'
  }).then((response) => {
    const personalisation = response.body.data[0].personalisation['reset_url']
    const cleansedPersonalisation = personalisation.replace((/^https?:\/\/[^/]+\//g).exec(personalisation), baseUrl)

    return cy.wrap(cleansedPersonalisation)
  })
})

Cypress.Commands.add('getUserRegistrationUrl', (baseUrl, email) => {
  cy.request({
    url: `${Cypress.env('ADMIN_URI')}notifications/last?${querystring.encode({ email })}`,
    log: false,
    method: 'GET'
  }).then((response) => {
    const personalisation = response.body.data[0].personalisation['link']
    const cleansedPersonalisation = personalisation.replace((/^https?:\/\/[^/]+\//g).exec(personalisation), baseUrl)

    return cy.wrap(cleansedPersonalisation)
  })
})
