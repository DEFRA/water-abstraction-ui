const { setUp, tearDown } = require('../../support/setup')
const { checkInlineAndSummaryErrorMessage, validateRadioOptions, validateRadioOptionsNthChild1, checkNoErrorMessage } = require('../../support/validation')
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
      validateRadioOptions('Select reason for new charge information', 'reason-12', 'Select a reason for new charge information')
    })

    describe('Set charge start date', () => {
      describe('user sets start date', () => {
        cy.get('.govuk-heading-l').contains('Set charge start date')
        cy.get('#startDate-4').click()
        cy.get('#customDate-day').type('01')
        cy.get('#customDate-month').type('06')
        cy.get('#customDate-year').type('2022')
        cy.get('form > .govuk-button').contains('Continue').click()
      })
    })

    describe('user selects billing contact', () => {
      cy.get('.govuk-heading-l').contains('Who should the bills go to?')
      cy.get('#account').click()
      cy.get('button.govuk-button').click()
    })

    describe('Select an existing address for Big Farm Co Ltd', () => {
      validateRadioOptions('Select an existing address for Big Farm Co Ltd', 'selectedAddress', 'Select an existing address, or set up a new one.')
    })

    describe('Do you need to add an FAO?', () => {
      validateRadioOptions('Do you need to add an FAO?', 'faoRequired-2', 'Select yes if you need to add a person or department as an FAO')
    })

    describe('user checks billing account details', () => {
      cy.get('.govuk-heading-l').contains('Check billing account details')
      cy.get('button.govuk-button').click()
    })

    describe('Use abstraction data to set up the element?', () => {
      validateRadioOptions('Use abstraction data to set up the element?', 'useAbstractionData-4', 'Select whether to use abstraction data to set up the element')
    })

    describe('user verifies the entered information', () => {
      cy.get('.govuk-summary-list__value').contains('1 June 2022').should('be.visible')
      cy.get('[value="addChargeCategory"]').click()
    })

    describe('user Assign charge reference', () => {
      describe('Enter a description for the charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter a description for the charge reference')
        describe('user clicks continue without choosing an option', () => {
          cy.get('form > .govuk-button').contains('Continue').click()
          checkInlineAndSummaryErrorMessage('Enter a description for the charge reference')
          cy.reload()
        })

        describe('user enters a description', () => {
          // We use .clear() to delete any previously accepted input
          cy.get('#description').clear().type('Automation-Test')
          cy.get('form > .govuk-button').contains('Continue').click()
        })
      })

      describe('Select the source', () => {
        validateRadioOptionsNthChild1('Select the source', 'source', 'Select if the source is tidal or non-tidal.')
      })

      describe('Select the loss category', () => {
        validateRadioOptionsNthChild1('Select the loss category', 'loss', 'Select if the loss category is high, medium or low.')
      })

      describe('Enter the total quantity to use for this charge reference', () => {
        cy.get('.govuk-heading-l').contains('Enter the total quantity to use for this charge reference')
        describe('user clicks continue without entering a volume', () => {
          cy.get('form > .govuk-button').contains('Continue').click()
          checkInlineAndSummaryErrorMessage('Enter the volume in ML (megalitres).')
          cy.reload()
        })

        describe('user inputs value between 0 and 1', () => {
          cy.get('#volume').type('0.5')
          cy.get('form > .govuk-button').contains('Continue').click()
          // Check that no error message was generated, then go back from the page we arrived at
          checkNoErrorMessage()
          cy.get('.govuk-back-link').click()
        })

        describe('user inputs amount', () => {
          cy.get('#volume').clear().type('150')
          cy.get('form > .govuk-button').contains('Continue').click()
        })
      })

      describe('Select the water availability', () => {
        validateRadioOptionsNthChild1('Select the water availability', 'isRestrictedSource', 'Select the water availability.')
      })

      describe('Select the water modelling charge', () => {
        cy.get('.govuk-heading-l').contains('Select the water modelling charge')
        describe('user clicks continue without choosing an option', () => {
          cy.get('form > .govuk-button').contains('Continue').click()
          checkInlineAndSummaryErrorMessage('Select the water modelling charge.')
          cy.reload()
        })
        describe('user selects option', () => {
          cy.get('#waterModel-2').click()
          cy.get('form > .govuk-button').contains('Continue').click()
        })
      })

      describe('Do additional charges apply?', () => {
        validateRadioOptionsNthChild1('Do additional charges apply?', 'isAdditionalCharges', 'Select \'yes\' if additional charges apply.')
      })

      describe('Is abstraction from a supported source?', () => {
        validateRadioOptionsNthChild1('Is abstraction from a supported source?', 'isSupportedSource', 'Select \'yes\' if abstraction is from a supported source.')
      })

      describe('Select the name of the supported source', () => {
        validateRadioOptions('Select the name of the supported source', 'supportedSourceId-12', 'Select the name of the supported source.')
      })

      describe('Is abstraction for the supply of public water?', () => {
        validateRadioOptionsNthChild1('Is abstraction for the supply of public water?', 'isSupplyPublicWater', 'Select \'yes\' if abstraction is for the supply of public water.')
      })

      describe('Do adjustments apply?', () => {
        validateRadioOptionsNthChild1('Do adjustments apply?', 'isAdjustments', 'Select \'yes\' if adjustments apply.')
      })

      describe('Which adjustments apply?', () => {
        cy.get('.govuk-heading-l').contains('Which adjustments apply?')
        describe('user clicks continue without choosing an option', () => {
          cy.get('form > .govuk-button').contains('Continue').click()
          checkInlineAndSummaryErrorMessage('At least one condition must be selected')
          cy.reload()
        })

        describe('user clicks chargeFactor without entering a value', () => {
          cy.get('#adjustments-2').click()
          cy.get('form > .govuk-button').contains('Continue').click()
          checkInlineAndSummaryErrorMessage('The \'Charge adjustment\' factor must not have more than 15 decimal places.')
          cy.reload()
        })

        describe('user selects option', () => {
          cy.get('#adjustments-2').click()
          cy.get('#chargeFactor').type('25')
          cy.get('form > .govuk-button').contains('Continue').click()
        })
      })
    })

    describe('Check charge information', () => {
      cy.get('#main-content')
        .children()
        .should('contain', 'Check charge information')
        .should('contain', 'Licence AT/CURR/DAILY/01')
        .should('contain', '1 June 2022')
        .should('contain', 'Additional charges')
        .should('contain', 'Adjustment factor')
        .should('contain', '25')
      cy.get(':nth-child(2) > .govuk-grid-column-full').contains('Confirm').click()
      cy.get('.govuk-panel__title').contains('Charge information complete').should('be.visible')
    })
  })
})
