const { setUp, tearDown } = require('../../support/setup')
const LICENCE_NUMBER = 'AT/CURR/DAILY/01'

describe('Create SRoC Charge version workflow journey', () => {
  before(() => {
    tearDown()
    setUp('billing-data')
  })

  after(() => {
    tearDown()
  })

  it('Create SRoC Charge version workflow journey', () => {
    cy.visit(Cypress.env('ADMIN_URI'))

    describe('User login', () => {
      // Enter the user name and Password
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.billingAndData)
        cy.get('#password').type(Cypress.env('DEFAULT_PASSWORD'))
        cy.get('.govuk-button.govuk-button--start').click()
        // assert once the user is signed in
        cy.contains('Search').should('be.visible')
        cy.contains('Enter a licence number, customer name, returns ID, registered email address or monitoring station').should('be.visible')
        // search for a license
        cy.get('#query').type(LICENCE_NUMBER).should('be.visible')
        cy.get('.search__button').click()
        cy.contains('Licences').should('be.visible')

        // click on the licence number
        cy.get('td').first().click()
        cy.url().should('contain', '/licences/')
        cy.contains(LICENCE_NUMBER).should('be.visible')
      })
    })

    describe('user navigates to the Charge information tab', () => {
      cy.get('#tab_charge').click()
      cy.get('#charge > .govuk-heading-l').should('have.text', 'Charge information')
    })

    describe('click Set up new charge', () => {
      cy.get('.govuk-button').contains('Set up a new charge').click()
    })

    describe('Select reason for new charge information', () => {
      cy.get('#reason-12').click()
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('user sets start date', () => {
      cy.get('.govuk-heading-l').contains('Set charge start date')
      cy.get('#startDate-4').click()
      cy.get('#customDate-day').type('01')
      cy.get('#customDate-month').type('06')
      cy.get('#customDate-year').type('2022')
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('user selects billing contact', () => {
      cy.get('.govuk-heading-l').contains('Who should the bills go to?')
      cy.get('#account').click()
      cy.get('button.govuk-button').click()
    })

    describe('Select an existing address for Big Farm Co Ltd', () => {
      cy.get('#selectedAddress [type="radio"]').first().click()
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('Do you need to add an FAO?', () => {
      cy.get('[id="faoRequired-2"][type="radio"]').click()
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('user checks billing account details', () => {
      cy.get('.govuk-heading-l').contains('Check billing account details')
      cy.get('button.govuk-button').click()
    })

    describe('Use abstraction data to set up the element?', () => {
      cy.get('.govuk-heading-l').contains('Use abstraction data to set up the element?')
      cy.get('[type="radio"]#useAbstractionData').click()
      cy.get('button.govuk-button').click()
    })

    describe('Check charge information', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information')
    })

    describe('Add a new charge element', () => {
      cy.get('[value="addElement"]').click()
      cy.get('.govuk-heading-l').contains('Select a purpose use')
      cy.get('[type="radio"]#purpose').click()
      cy.get('button.govuk-button').click()
      cy.get('.govuk-heading-l').contains('Add element description')
      cy.get('[type="text"]#description').type('test element description')
      cy.get('button.govuk-button').click()
      cy.get('.govuk-heading-l').contains('Set abstraction period')
      cy.get('[type="text"]#startDate-day').type('01')
      cy.get('[type="text"]#startDate-month').type('04')
      cy.get('[type="text"]#endDate-day').type('30')
      cy.get('[type="text"]#endDate-month').type('09')
      cy.get('button.govuk-button').click()
      cy.get('.govuk-heading-l').contains('Add annual quantities')
      cy.get('[type="text"]#authorisedAnnualQuantity').type('10')
      cy.get('button.govuk-button').click()
      cy.get('.govuk-heading-l').contains('Set time limit?')
      cy.get('[type="radio"]#timeLimitedPeriod-2').click()
      cy.get('button.govuk-button').click()
      cy.get('.govuk-heading-l').contains('Select loss category')
      cy.get('[type="radio"]#loss-2').click()
      cy.get('button.govuk-button').click()
      cy.get('form > .govuk-button').click();
    })

    describe('Check charge information and add Charge Category', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information')
    })

    describe('user Assign charge reference', () => {
      cy.get('[value="addChargeCategory"]').click()
      cy.get('.govuk-heading-l').contains('Select the elements this charge reference is for')
      cy.get('[type="checkbox"]').check()
      cy.get('button.govuk-button').click()

      describe('Enter a description for the charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter a description for the charge reference')
        cy.get('#description').clear().type('Automation-Test')
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Select the source', () => {
        cy.get('.govuk-heading-l').contains('Select the source')
        cy.get('[type="radio"]#source').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Select the loss category', () => {
        cy.get('.govuk-heading-l').contains('Select the loss category')
        cy.get('[type="radio"]#loss').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Enter the total quantity to use for this charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter the total quantity to use for this charge reference')
        cy.get('#volume').clear().type('150')
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Select the water availability', () => {
        cy.get('.govuk-heading-l').contains('Select the water availability')
        cy.get('[type="radio"]#isRestrictedSource').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Select the water modelling charge', () => {
        cy.get('.govuk-heading-l').contains('Select the water modelling charge')
        cy.get('[type="radio"]#waterModel-2').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Do additional charges apply?', () => {
        cy.get('.govuk-heading-l').contains('Do additional charges apply?')
        cy.get('[type="radio"]#isAdditionalCharges').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Is abstraction from a supported source?', () => {
        cy.get('.govuk-heading-l').contains('Is abstraction from a supported source?')
        cy.get('[type="radio"]#isSupportedSource').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Select the name of the supported source', () => {
        cy.get('.govuk-heading-l').contains('Select the name of the supported source')
        cy.get('[type="radio"]#supportedSourceId-12').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Is abstraction for the supply of public water?', () => {
        cy.get('.govuk-heading-l').contains('Is abstraction for the supply of public water?')
        cy.get('[type="radio"]#isSupplyPublicWater').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })

      describe('Do adjustments apply?', () => {
        cy.get('.govuk-heading-l').contains('Do adjustments apply?')
        cy.get('[type="radio"]#isAdjustments-2').click()
        cy.get('form > .govuk-button').contains('Continue').click()
      })
    })

    describe('Both charge elements are visible on the charge summary screen', () => {
      cy.get('.govuk-caption-m').eq(0).invoke('text').should('eq', 'Charge element 1')
      cy.get('.govuk-caption-m').eq(1).invoke('text').should('eq', 'Charge element 2')
      cy.get('.govuk-summary-list__value').should('contain', 'test element description')
    })
  })
})
