const { setUp, tearDown } = require('../../../support/setup')
const { v4: uuid } = require('uuid')

describe('creating an internal user:', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  it('navigates to the new internal user form and creates an internal account', () => {
    cy.visit(Cypress.env('ADMIN_URI'))
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.super)
    })

    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()
    cy.get('#navbar-notifications').click()
    // sees the page header
    cy.get('.govuk-heading-l').should('contain.text', 'Manage reports and notices')

    // verifies the create an internal account link exists
    cy.get('.govuk-list').should('contain.text', 'Create an internal account')
    // clicks on the create user button
    cy.get(':nth-child(11) > li > .govuk-link').click()

    describe('verifies the contents on the create user page', () => {
      cy.get('form').should('be.visible')
      cy.get('.govuk-label').should('contain.text', 'Enter a gov.uk email address')
      cy.get('input#email').should('be.visible')
      cy.get('.govuk-button').should('contain.text', 'Continue')
    })
    describe('populates the email field and submits the form', () => {
      const tempEmail = `regression.tests.${uuid()}@defra.gov.uk`
      cy.get('input#email').type(tempEmail)
      cy.get('form > .govuk-button').click()
    })

    describe('verify the contents on the page', () => {
      cy.get('form[action="/account/create-user/set-permissions"]').should('be.visible')
      cy.get('div.govuk-radios').children().should('have.length', 8)
      cy.get('form > .govuk-button').should('contain.text', 'Continue')
    })

    describe('select a permission level and click on continue', () => {
      cy.get('[type="radio"]').check('basic')
      cy.get('form > .govuk-button').click()
      cy.get('h1.govuk-heading-l').should('contain.text', 'New account created')
    })
  })
})
