
const { setUp, tearDown } = require('../../support/setup');
const checkErrorMessage = (message) => {
  describe('it sees the correct error message', () => {
    cy.get('.govuk-list > li > a').should('have.text', message);
  });
};

describe('submit a return metered readings return as an external user', () => {
  beforeEach(() => {
    tearDown();
    setUp('barebones');
  });

  afterEach(() => {
    tearDown();
  });

  it('sees the page title', () => {
    cy.visit(Cypress.env('USER_URI'));

    // tap the sign in button on the welcome page
    cy.get('a[href*="/signin"]').click();
    cy.fixture('users.json').then(users => {
      cy.get('input#email').type(users.external);
    });
    cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));

    //  Click Sign in Button
    cy.get('.govuk-button.govuk-button--start').click();
    cy.contains('Your licences').should('have.class', 'govuk-heading-l');

    describe('sees the licences table', () => {
      cy.contains('AT/CURR/DAILY/01').should('be.visible');
      cy.get('#results').should('be.visible');
    });

    describe('sees the three licences created by the setup routine', () => {
      cy.get('#results').should('contain.text', 'AT/CURR/MONTHLY/02');
    });
    describe('clicks on the MONTHLY licence 02', () => {
      cy.contains('AT/CURR/MONTHLY/02').click();
      cy.get('.govuk-heading-l').should('be.visible').and('contain.text', 'Licence number AT/CURR/MONTHLY/02');
    });

    describe('sees the Summary table', () => {
      cy.get('#summary').should('be.visible');
    });

    describe('it clicks on the returns tab link', () => {
      cy.get('#tab_returns').click();
    });
    describe('sees the returns table', () => {
      cy.get('#returns').should('be.visible');
    });

    describe('it clicks on the return id 9999992 to start the returns flow', () => {
      cy.get(':nth-child(1) > [scope="row"] > a').click();
      cy.get('.govuk-heading-l').should('contain.text', 'the monthly doughnut licence');
      cy.get('.govuk-caption-l').should('contain.text', 'Abstraction return for licence number AT/CURR/MONTHLY/02');
      cy.get('form').should('be.visible');
      cy.get('form>.govuk-button').click();
    });
    checkErrorMessage('Has any water been abstracted?');

    describe('selects yes - water has been abstracted', () => {
      cy.get('input[value="false"]').check();
      cy.get('form>.govuk-button').click();
    });

    describe('selects no option for "How are you reporting your figures"', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-radios__label').eq(0).should('contain.text', 'Readings from a single meter');
      cy.get('.govuk-radios__label').eq(1).should('contain.text', 'Volumes from one or more meters');
      cy.get('.govuk-radios__label').eq(2).should('contain.text', 'Estimates without a meter');
      cy.get('form>.govuk-button').click();
    });

    checkErrorMessage('Select readings from one meter, or other (abstraction volumes)');

    describe('selects "Readings from a single meter"', () => {
      cy.get('input[value="oneMeter,measured"]').check();
      cy.get('form>.govuk-button').click();
    });

    describe('selects no option for "Did your meter reset in this abstraction period?"', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-fieldset__legend').should('contain.text', 'Did your meter reset in this abstraction period?');
      cy.get('.govuk-radios').eq(0).should('contain.text', 'Yes');
      cy.get('.govuk-radios').children(1).should('contain.text', 'No');
      cy.get('form>.govuk-button').click();
    });

    checkErrorMessage('Has your meter reset or rolled over?');

    describe('selects No to meter reset', () => {
      cy.get('input[value="false"]').check();
      cy.get('form>.govuk-button').click();
    });

    describe('does not select a unit and clicks continue', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-fieldset__legend').should('contain.text', 'Which units are you using?');
      cy.get('div.govuk-radios__item').eq(0).should('contain.text', 'Cubic metres');
      cy.get('div.govuk-radios__item').eq(1).should('contain.text', 'Litres');
      cy.get('div.govuk-radios__item').eq(2).should('contain.text', 'Megalitres');
      cy.get('div.govuk-radios__item').eq(3).should('contain.text', 'Gallons');
      cy.get('form>.govuk-button').click();
    });

    checkErrorMessage('Select a unit of measurement');

    describe('selects cubic meters', () => {
      cy.get('[type="radio"]').check('m³');
      cy.get('form>.govuk-button').click();
    });

    describe('enters no meter readings', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-heading-m').should('contain.text', 'Enter your readings exactly as they appear on your meter');
      cy.get('form>.govuk-button').click();
    });

    checkErrorMessage('Enter a meter start reading');

    describe('enters a negaive meter reading', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-heading-m').should('contain.text', 'Enter your readings exactly as they appear on your meter');
      cy.get('input[name="startReading"]').type('-1');
      cy.get('input[name="2021-01-01_2021-01-31"]').type('10');
      cy.get('input[name="2021-02-01_2021-02-28"]').type('20');
      cy.get('form>.govuk-button').click();
    });
    checkErrorMessage('This number should be positive');

    describe('enters non incremental meter readings', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-heading-m').should('contain.text', 'Enter your readings exactly as they appear on your meter');
      cy.get('input[name="startReading"]').clear().type('10');
      cy.get('input[name="2021-01-01_2021-01-31"]').clear().type('0');// this can not be lower than the previous reading
      cy.get('input[name="2021-02-01_2021-02-28"]').clear().type('20');
      cy.get('form>.govuk-button').click();
    });
    checkErrorMessage('Each meter reading should be higher than or equal to the last');
    describe('selects cubic meters', () => {
      cy.get('input[name="startReading"]').clear().type('0');
      cy.get('input[name="2021-01-01_2021-01-31"]').clear().type('10');
      cy.get('input[name="2021-02-01_2021-02-28"]').clear().type('20');
      cy.get('form>.govuk-button').click();
    });
    describe('enters the meter readings', () => {
      cy.get('form').should('be.visible');
      cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
      cy.get('form>.govuk-button').click();
    });
    checkErrorMessage('Enter the make of your meter');
    describe('Enters Meter details', () => {
      cy.get('input[name="manufacturer"]').type('Test Water Meter');
      cy.get('input[name="serialNumber"]').type('Test serial number');
      cy.get('#isMultiplier').check();
      cy.get('form>.govuk-button').click();
    });

    describe('confirms and submit the return details', () => {
      cy.get('form').should('be.visible');
      cy.get('h2.govuk-heading-l').should('contain.text', 'Confirm your return');
      cy.get(':nth-child(3) > strong').should('contain.text', '200');
      cy.get('form>.govuk-button').click();
    });

    describe('receives success confirmation for submitted return', () => {
      cy.get('.panel__title').should('contain.text', 'Return submitted');
      cy.get('#signout').click();
    });
  });

  /**
 * Nill return
 */
  describe('submit a nill return as an external user', () => {
    it('sees the page title', () => {
      cy.visit(Cypress.env('USER_URI'));
      // tap the sign in button on the welcome page
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.external);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
      //  Click Sign in Button
      cy.get('.govuk-button.govuk-button--start').click();
      cy.contains('Your licences').should('have.class', 'govuk-heading-l');

      describe('sees the licences table', () => {
        cy.contains('AT/CURR/DAILY/01').should('be.visible');
        cy.get('#results').should('be.visible');
      });

      describe('sees the three licences created by the setup routine', () => {
        cy.get('#results').should('contain.text', 'AT/CURR/MONTHLY/02');
      });
      describe('clicks on the MONTHLY licence 02', () => {
        cy.contains('AT/CURR/MONTHLY/02').click();
        cy.get('.govuk-heading-l').should('be.visible').and('contain.text', 'Licence number AT/CURR/MONTHLY/02');
      });

      describe('sees the Summary table', () => {
        cy.get('#summary').should('be.visible');
      });

      describe('it clicks on the returns tab link', () => {
        cy.get('#tab_returns').click();
      });
      describe('sees the returns table', () => {
        cy.get('#returns').should('be.visible');
      });

      describe('it clicks on the return id 9999990', () => {
        cy.get(':nth-child(4) > [scope="row"] > a').click();
        cy.get('.govuk-heading-l').should('contain.text', 'the monthly doughnut licence');
        cy.get('.govuk-caption-l').should('contain.text', 'Abstraction return for licence number AT/CURR/MONTHLY/02');
        cy.get('form').should('be.visible');
        cy.get('#isNil-2').check();
        cy.get('form>.govuk-button').click();
      });
      describe('confirms and submit the Nil return details', () => {
        cy.get('form').should('be.visible');
        cy.get('h2.govuk-heading-l').should('contain.text', 'Nil return');
        cy.get('form>.govuk-button').click();
      });
      describe('receives success confirmation for submitted return', () => {
        cy.get('.panel__title').should('contain.text', 'Return submitted');
        cy.get('#signout').click();
      });
    });
  });

  /**
 * a helper method to complete
 * the returns flow up to selecting a unit of measure
 */
  const completeFlowUntilUnits = () => {
    describe('sees the page title', () => {
      cy.contains('Your licences').should('have.class', 'govuk-heading-l');
    });

    describe('sees the licences table', () => {
      cy.get('#results').should('be.visible');
    });

    describe('sees the three licences created by the setup routine', () => {
      cy.get('#results').should('contain.text', 'AT/CURR/MONTHLY/02');
    });

    describe('clicks on the MONTHLY licence 02', () => {
      cy.contains('AT/CURR/MONTHLY/02').click();
      cy.get('.govuk-heading-l').should('be.visible').and('contain.text', 'Licence number AT/CURR/MONTHLY/02');
    });

    describe('sees the Summary table', () => {
      cy.get('#summary').should('be.visible');
    });

    describe('it clicks on the returns tab link', () => {
      cy.get('#tab_returns').click();
    });

    describe('sees the returns table', () => {
      cy.get('#returns').should('be.visible');
    });

    describe('it clicks on the return id 9999991', () => {
      cy.get(':nth-child(2) > [scope="row"] > a').click();
      cy.get('.govuk-heading-l').should('contain.text', 'the monthly doughnut licence');
      cy.get('.govuk-caption-l').should('contain.text', 'Abstraction return for licence number AT/CURR/MONTHLY/02');
      cy.get('form').should('be.visible');
      cy.get('form>.govuk-button').click();
    });

    describe('selects yes for water has been abstracted in this period', () => {
      cy.get('input[value="false"]').check();
      cy.get('form>.govuk-button').click();
    });

    describe('selects "Volumes from one or more meters"', () => {
      cy.get('form').should('be.visible');
      cy.get('input[value="abstractionVolumes,measured"]').check();
      cy.get('form>.govuk-button').click();
    });
  };

  /**
 * a helper method to set the monthly return volumes
 */
  const setMonthlyReturnVolumes = (data) => {
    cy.get('input[name="2020-01-01_2020-01-31"]').clear().type(data.jan);
    cy.get('input[name="2020-02-01_2020-02-29"]').clear().type(data.feb);
    cy.get('input[name="2020-03-01_2020-03-31"]').clear().type(data.mar);
    cy.get('input[name="2020-04-01_2020-04-30"]').clear().type(data.apr);
    cy.get('input[name="2020-05-01_2020-05-31"]').clear().type(data.may);
    cy.get('input[name="2020-06-01_2020-06-30"]').clear().type(data.jun);
    cy.get('input[name="2020-07-01_2020-07-31"]').clear().type(data.jul);
    cy.get('input[name="2020-08-01_2020-08-31"]').clear().type(data.aug);
    cy.get('input[name="2020-09-01_2020-09-30"]').clear().type(data.sep);
    cy.get('input[name="2020-10-01_2020-10-31"]').clear().type(data.oct);
    cy.get('input[name="2020-11-01_2020-11-30"]').clear().type(data.nov);
    cy.get('input[name="2020-12-01_2020-12-31"]').clear().type(data.dec);
  };

  /**
 * submit return by volmes measured
 */

  /**
   *
   * Test Litres
   */
  describe('submit a return by volumes as an external user', () => {
    it('User login and navigates to the abstraction return page', () => {
      cy.visit(Cypress.env('USER_URI'));
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.external);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
      //  Click Sign in Button
      cy.get('.govuk-button.govuk-button--start').click();

      completeFlowUntilUnits();

      describe('selects litres as the unit measured', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-fieldset__legend').should('contain.text', 'Which units are you using?');
        cy.get('input[value="l"]').check();
        cy.get('form>.govuk-button').click();
      });

      describe('enters negative volumes', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your abstraction volumes');
        const data = {
          jan: '-1000',
          feb: '-1000',
          mar: '-1000',
          apr: '-1000',
          may: '-1000',
          jun: '-1000',
          jul: '-1000',
          aug: '-1000',
          sep: '-1000',
          oct: '-1000',
          nov: '-1000',
          dec: '-1000'
        };
        setMonthlyReturnVolumes(data);
        cy.get('form>.govuk-button').click();
      });

      describe('verify the error message', () => {
        cy.get('#error-summary-title').should('contain.text', 'There is a problem');
        cy.get('.govuk-error-summary__list').children().should('have.length', '12');
        cy.get('.govuk-error-summary__list').children(0).should('contain.text', 'Enter an amount of 0 or above');
      });

      describe('enters the correct volumes', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your abstraction volumes');
        const data = {
          jan: '10000',
          feb: '10000',
          mar: '10000',
          apr: '10000',
          may: '10000',
          jun: '10000',
          jul: '10000',
          aug: '10000',
          sep: '10000',
          oct: '10000',
          nov: '10000',
          dec: '10000'
        };
        setMonthlyReturnVolumes(data);
        cy.get('form>.govuk-button').click();
      });

      describe('enters the meter details', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
        cy.get('input[name="manufacturer"]').type('Test Water Meter');
        cy.get('input[name="serialNumber"]').type('Test serial number');
        cy.get('input[name="isMultiplier"]').check();
        cy.get('form>.govuk-button').click();
      });
      describe('confirms the total abstration volume calculated is correct', () => {
        cy.get('form').should('be.visible');
        cy.get('h2.govuk-heading-l').should('contain.text', 'Confirm your return');
        cy.get(':nth-child(3) > strong').should('contain.text', '120');
      });

      describe('goes back to the change the volumes', () => {
        cy.get('.govuk-back-link').click();
        cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
        cy.get('.govuk-back-link').click();
      });

      describe('enters the volumes with some blank values', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your abstraction volumes');
        const data = {
          jan: '10000',
          feb: ' ',
          mar: '10000',
          apr: ' ',
          may: '10000',
          jun: ' ',
          jul: ' ',
          aug: '10000',
          sep: ' ',
          oct: ' ',
          nov: '10000',
          dec: '10000'
        };
        setMonthlyReturnVolumes(data);
        cy.get('form>.govuk-button').click();
      });

      describe('enters the meter details', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
        cy.get('input[name="manufacturer"]').clear().type('Test Water Meter');
        cy.get('input[name="serialNumber"]').clear().type('Test serial number');
        cy.get('input[name="isMultiplier"]').check();
        cy.get('form>.govuk-button').click();
      });

      describe('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
        cy.get('form').should('be.visible');
        cy.get('h2.govuk-heading-l').should('contain.text', 'Confirm your return');
        cy.get(':nth-child(3) > strong').should('contain.text', '60');
        cy.get('form>.govuk-button').click();
      });

      describe('receives success confirmation for submitted return', () => {
        cy.get('.panel__title').should('contain.text', 'Return submitted');
        cy.get('#signout').click();
      });
    });
  });

  /**
   * TESTS GALLONS
   */
  describe('tests returns measured in gallons', () => {
    it('User login and navigates to the abstraction return page', () => {
      cy.visit(Cypress.env('USER_URI'));
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.external);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
      //  Click Sign in Button
      cy.get('.govuk-button.govuk-button--start').click();
      completeFlowUntilUnits();

      describe('selects gallons as the unit measured', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-fieldset__legend').should('contain.text', 'Which units are you using?');
        cy.get('input[value="gal"]').check();
        cy.get('form>.govuk-button').click();
      });

      describe('enters the volumes with some blank values', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your abstraction volumes');
        const data = {
          jan: '1',
          feb: '1',
          mar: '1',
          apr: '1',
          may: '1',
          jun: ' ',
          jul: ' ',
          aug: '1',
          sep: ' ',
          oct: '1',
          nov: ' ',
          dec: '1'
        };
        setMonthlyReturnVolumes(data);
        cy.get('form>.govuk-button').click();
      });

      describe('enters the meter details', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
        cy.get('input[name="manufacturer"]').type('Test Water Meter');
        cy.get('input[name="serialNumber"]').type('Test serial number');
        cy.get('form>.govuk-button').click();
      });

      describe('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
        cy.get('form').should('be.visible');
        cy.get('h2.govuk-heading-l').should('contain.text', 'Confirm your return');
        cy.get(':nth-child(3) > strong').should('contain.text', '0.036');
        cy.get('form>.govuk-button').click();
      });

      describe('receives success confirmation for submitted return', () => {
        cy.get('.panel__title').should('contain.text', 'Return submitted');
        cy.get('#signout').click();
      });
    });
  });

  /**
//  *  TESTS MEGA LITRES
//  */
  describe('tests returns measured in mega litres', () => {
    it('User login and navigates to the abstraction return page', () => {
      cy.visit(Cypress.env('USER_URI'));
      cy.get('a[href*="/signin"]').click();
      cy.fixture('users.json').then(users => {
        cy.get('input#email').type(users.external);
      });
      cy.get('input#password').type(Cypress.env('DEFAULT_PASSWORD'));
      //  Click Sign in Button
      cy.get('.govuk-button.govuk-button--start').click();

      completeFlowUntilUnits();

      describe('selects litres as the unit measured', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-fieldset__legend').should('contain.text', 'Which units are you using?');
        cy.get('[value="Ml"]').check();
        cy.get('form>.govuk-button').click();
      });

      describe('enters the volumes with some blank values', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your abstraction volumes');

        const data = {
          jan: '1',
          feb: '1',
          mar: '1',
          apr: '1',
          may: '1',
          jun: ' ',
          jul: ' ',
          aug: '1',
          sep: ' ',
          oct: '1',
          nov: ' ',
          dec: '1'
        };
        setMonthlyReturnVolumes(data);
        cy.get('form>.govuk-button').click();
      });

      describe('enters the meter details', () => {
        cy.get('form').should('be.visible');
        cy.get('.govuk-heading-m').should('contain.text', 'Your current meter details');
        cy.get('input[name="manufacturer"]').type('Test Water Meter');
        cy.get('input[name="serialNumber"]').type('Test serial number');
        cy.get('form>.govuk-button').click();
      });

      describe('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
        cy.get('form').should('be.visible');
        cy.get('h2.govuk-heading-l').should('contain.text', 'Confirm your return');
        cy.get(':nth-child(3) > strong').should('contain.text', '8,000');
        cy.get('form>.govuk-button').click();
      });

      describe('receives success confirmation for submitted return', () => {
        cy.get('.panel__title').should('contain.text', 'Return submitted');
        cy.get('#signout').click();
      });
    });
  });
});
