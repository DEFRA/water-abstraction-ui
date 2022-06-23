const { setUp, tearDown } = require('../../support/setup')
const { checkInlineAndSummaryErrorMessage, validateRadioOptions } = require('../../support/validation')
const LICENCE_NUMBER = 'L1'

const billingAddress = 'Environment Agency Horizon House Deanery Road, Bristol, BS1 5AH'
const firstName = 'Jim'
const lastName = 'Bob'
const fullName = 'John Smith'
describe('License transfer to new billing account', () => {
  before(() => {
    tearDown()
    setUp('five-year-two-part-tariff-bill-runs')
  })

  after(() => {
    tearDown()
  })

  it('License transfer to new billing account', () => {
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

        cy.contains('td', 'L1')
          .contains('a', 'L1')
          .click()

        cy.contains(LICENCE_NUMBER).should('be.visible')
      })
    })

    describe('user navigates to the Charge information tab', () => {
      cy.get('#tab_charge').click()
      cy.contains('Charge information')
    })

    describe('click Set up new charge', () => {
      cy.get('.govuk-button').contains('Set up a new charge').click()
    })

    describe('Select reason for new charge information', () => {
      validateRadioOptions('Select reason for new charge information', 'reason-12', 'Select a reason for new charge information')
    })

    describe('Set charge start date', () => {
      describe('user clicks continue without choosing an option', () => {
        cy.get('button.govuk-button').click()
        checkInlineAndSummaryErrorMessage('Select charge information start date')
        cy.reload()
      })

      describe('user click continue without setting start date', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date')
        cy.get('#startDate-4').click()
        cy.get('form > .govuk-button').contains('Continue').click()
        checkInlineAndSummaryErrorMessage('Enter the charge information start date')
        cy.reload()
      })

      describe('user click continue without setting a year', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date')
        cy.get('#startDate-4').click()
        cy.get('#customDate-day').type('01')
        cy.get('#customDate-month').type('06')
        cy.get('form > .govuk-button').contains('Continue').click()
        checkInlineAndSummaryErrorMessage('Date must be after the start date of the earliest known licence version')
        cy.reload()
      })

      describe('user click continue without correct date format', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date')
        cy.get('#startDate-4').click()
        cy.get('#customDate-day').type('aa')
        cy.get('#customDate-month').type('06')
        cy.get('form > .govuk-button').contains('Continue').click()
        checkInlineAndSummaryErrorMessage('Enter a real date for the charge information start date')
        cy.reload()
      })

      describe('user sets start date', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date')
        cy.get('#startDate-4').click()
        cy.get('#customDate-day').type('01')
        cy.get('#customDate-month').type('06')
        cy.get('#customDate-year').type('2022')
        cy.get('form > .govuk-button').contains('Continue').click()
      })
    })

    describe('Select an existing billing account for Big Farm Co Ltd', () => {
      cy.get('.govuk-heading-l').contains('Select an existing billing account for Big Farm Co Ltd')
      cy.get('form > .govuk-button').contains('Continue').click()
      checkInlineAndSummaryErrorMessage('Select a billing account or set up a new one')
      cy.reload()
      cy.get('#billingAccountId-3').click()
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('Who should the bills go to?', () => {
      cy.get('.govuk-heading-l').contains('Who should the bills go to?')
      cy.get('#account-2').click()
      cy.get('form > .govuk-button').contains('Continue').click()
      checkInlineAndSummaryErrorMessage('Enter the name of an organisation or individual.')
      cy.reload()
      cy.get('#account-2').click()
      cy.get('#accountSearch').type('Automation-Test-Comp')
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('Select the account type', () => {
      cy.get('.govuk-heading-l').contains('Select the account type')
      cy.get('form > .govuk-button').contains('Continue').click()
      checkInlineAndSummaryErrorMessage('Select the account type')
      cy.reload()
      cy.get('#accountType-3').click()
      cy.get('form > .govuk-button').contains('Continue').click()
      checkInlineAndSummaryErrorMessage('Enter the full name')
      cy.reload()
      cy.get('#accountType-3').click()
      cy.get('#personName').type(fullName)
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('Select an existing address for Big Farm Co Ltd', () => {
      validateRadioOptions('Select an existing address for Big Farm Co Ltd', 'selectedAddress-3', 'Select an existing address, or set up a new one.')
    })

    describe('Select the account type', () => {
      cy.get('.govuk-heading-l').contains('Enter the UK postcode')
      cy.get('form > .govuk-button').contains('Find address').click()
      checkInlineAndSummaryErrorMessage('Enter a UK postcode')
      cy.reload()
      cy.get('#postcode').type('BS1 5AH')
      cy.get('form > .govuk-button').contains('Find address').click()
    })

    describe('Select the address', () => {
      cy.get('.govuk-heading-l').contains('Select the address')
      cy.get('form > .govuk-button').contains('Continue').click()
      checkInlineAndSummaryErrorMessage('Select an address from the list')
      cy.reload()
      cy.get('#uprn').select(billingAddress).should('have.value', '340116')
      cy.get('form > .govuk-button').contains('Continue').click()
    })

    describe('Do you need to add an FAO?', () => {
      validateRadioOptions('Do you need to add an FAO?', 'faoRequired', 'Select yes if you need to add a person or department as an FAO')
    })

    describe('Set up a contact', () => {
      validateRadioOptions('Set up a contact', 'selectedContact', 'Select an existing contact or select add new person or department')
    })

    describe('Add a new contact', () => {
      cy.get('.govuk-heading-l').contains('Add a new contact')
      describe('error - empty', () => {
        cy.get('form > .govuk-button').contains('Continue').click()
        checkInlineAndSummaryErrorMessage('Enter a first name')
        cy.reload()
      })
      describe('error - no last name  name', () => {
        cy.get('#firstName').type(firstName)
        cy.get('form > .govuk-button').contains('Continue').click()
        checkInlineAndSummaryErrorMessage('Enter a last name')
        cy.reload()
      })

      describe('good', () => {
        cy.get('#firstName').type(firstName)
        cy.get('#lastName').type(lastName)
        cy.get('form > .govuk-button').contains('Continue').click()
      })
    })

    describe('Check billing account details', () => {
      cy.get('.govuk-heading-l').contains('Check billing account details')

      cy.get('.govuk-summary-list__row').should(items => {
        expect(items[0]).to.contain.text('Billing contact name')
        expect(items[0]).to.contain.text(fullName)
        expect(items[1]).to.contain.text('Billing address')
        expect(items[1]).to.contain.text('\n  \n    ' +
            'Environment Agency\n  \n  \n    ' +
            'Horizon House\n  \n    \n  ' +
            'Deanery Road\n  \n  \n  \n    ' +
            'Bristol\n  \n  \n  \n    ' +
            'BS1 5AH\n  \n  \n    ' +
            'United Kingdom\n')
        expect(items[2]).to.contain.text('FAO')
        expect(items[2]).to.contain.text(`${firstName}\n    ${lastName}`)
      })
      cy.get('button.govuk-button').click()
    })

    describe('Use abstraction data to set up the element?', () => {
      validateRadioOptions('Use abstraction data to set up the element?', 'useAbstractionData', 'Select whether to use abstraction data to set up the element')
    })

    describe('Check charge information', () => {
      cy.get('.govuk-heading-xl').contains('Check charge information')

      cy.get('.govuk-summary-list__row').should(items => {
        expect(items[0]).to.contain.text('Reason')
        expect(items[0]).to.contain.text('Strategic review of charges (SRoC)')
        expect(items[1]).to.contain.text('Start date')
        expect(items[1]).to.contain.text('1 June 2022')
        expect(items[2]).to.contain.text('Billing account')
        expect(items[2]).to.contain.text('FAO\n                \n  \n    \n    ' +
            'Jim\n    Bob\n  \n\n              \n              \n                \n  ' +
            'John Smith\n\n              \n              \n  \n    ' +
            'Environment Agency\n  \n  \n    ' +
            'Horizon House\n  \n    \n  ' +
            'Deanery Road\n  \n  \n  \n    ' +
            'Bristol\n  \n  \n  \n    ' +
            'BS1 5AH\n  \n  \n    ' +
            'United Kingdom\n')
        expect(items[3]).to.contain.text('Licence holder')
        expect(items[3]).to.contain.text('Big Farm Co Ltd')
      })
    })
  })
})
