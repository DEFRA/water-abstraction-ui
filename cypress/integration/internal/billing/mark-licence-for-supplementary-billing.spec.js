const { setUp, tearDown } = require('../../../support/setup')

describe('check for different status for a licence in returns tab as internal user', () => {
  before(() => {
    tearDown()
    setUp('barebones')
  })

  after(() => {
    tearDown()
  })

  it('logs in and searches for a licence', () => {
    // cy.visit to visit the URL
    cy.visit(Cypress.env('ADMIN_URI'))
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.billingAndData)
    })
    cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
    cy.get('.govuk-button.govuk-button--start').click()

    // assert once the user is signed in
    cy.contains('Search')

    // search for a license by using Licence Number
    cy.get('#query').clear()
    cy.get('#query').type('AT/CURR/MONTHLY/02').should('be.visible')
    cy.get('.search__button').click()
    cy.contains('Licences').should('be.visible')
    cy.get('.govuk-table__row').contains('AT/CURR/MONTHLY/02').click()

    describe('it clicks on the returns tab link', () => {
      cy.get('#tab_returns').click()
    })
    describe('sees the returns table', () => {
      cy.get('#returns').should('be.visible')
    })

    describe('it clicks on the return id 9999992 to start the returns flow', () => {
      cy.get(':nth-child(1) > [scope="row"] > a').click()
      cy.get('.govuk-heading-l').should('contain.text', 'the monthly doughnut licence')
      cy.get('.govuk-caption-l').should('contain.text', 'Abstraction return for licence number AT/CURR/MONTHLY/02')
      cy.get('form').should('be.visible')
    })

    describe('opts to edit the return', () => {
      cy.get('input[value="submit"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('says that the return was received today', () => {
      cy.get('input[value="today"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('says that it\'s not a NIL return', () => {
      cy.get('input[value="false"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('opts to fill out the return by way of volumes', () => {
      cy.get('input[value="abstractionVolumes"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('opts to use cubic meters', () => {
      cy.get('input[value="m³"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('says that meter details were not provided', () => {
      cy.get('input[value="false"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('says that a meter was not used', () => {
      cy.get('input[value="false"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('says that it is a single volume', () => {
      cy.get('input[value="true"]').check()

      cy.get('#total').type('100')
      cy.get('form>.govuk-button').click()
    })

    describe('says that there is no need for custom dates', () => {
      cy.get('input[value="false"]').check()
      cy.get('form>.govuk-button').click()
    })

    describe('presses continue without modifying the volume spread', () => {
      cy.get('form>.govuk-button').click()
    })

    describe('confirms the return submission', () => {
      cy.get('form>.govuk-button').click()
    })

    describe('taps on the button to mark the licence for supplementary billing', () => {
      cy.get('.govuk-button').contains('Mark for supplementary bill run').click()
    })

    describe('taps on the button to confirm that the licence should be added to supplementary billing', () => {
      cy.get('.govuk-button').contains('Confirm').click()
    })

    describe('opts to return to the licence page', () => {
      cy.get('a').contains('Return to the licence').click()
    })

    describe('ensures that the banner is visible', () => {
      cy.get('.govuk-notification-banner__content').contains('This licence has been marked for the next supplementary bill run').should('be.visible')
    })
  })
})
