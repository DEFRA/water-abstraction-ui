/*'use strict';

const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getPageTitle, getPageCaption, getButton, getLabel, getBackLink, getValidationSummaryMessage } = require('../shared/helpers/page');
const { setUp, tearDown } = require('../shared/helpers/setup');
const EMAIL_ADDRESS = userEmails.external; */

/* eslint-disable no-undef */
/**
 * helper method to test the error messages of a form
 * @param {*} message error message expected on the form
 */
const checkErrorMessage = (message) => {
  describe('it sees the correct error message', () => {
   cy.get('.govuk-list > li > a').should('have.text',message); 
  });
};
const { contain } = require('@hapi/hoek');
const { setUp, tearDown } = require('../../support/setup');

/**
 * submit meter readings for the rturn
 */
describe('submit a return metered readings return as an external user', () => {
    before(() => {
        tearDown();
        setUp('barebones');
      });
    
      after(() => {
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
        cy.get('#results').should('contain.text','AT/CURR/MONTHLY/02');
      });
      describe('clicks on the MONTHLY licence 02', () => {
        cy.contains('AT/CURR/MONTHLY/02').click();

        cy.get('.govuk-heading-l').should('be.visible').and('contain.text','Licence number AT/CURR/MONTHLY/02');
      });

      describe('sees the Summary table', () => {
        cy.get('#summary').should('be.visible');
        
      });

      describe('it clicks on the returns tab link',  () => {
        cy.get('#tab_returns').click();     
      });
      describe('sees the returns table', () => {
        cy.get('#returns').should('be.visible');
      });

      describe('it clicks on the return id 9999992 to start the returns flow', () => {
        cy.get(':nth-child(1) > [scope="row"] > a').click();
        cy.get('.govuk-heading-l').should('contain.text','Abstraction return');
        cy.get('.govuk-caption-l').should('contain.text','Licence number AT/CURR/MONTHLY/02');
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
        cy.get('.govuk-fieldset__legend').should('contain.text','Did your meter reset in this abstraction period?')
       cy.get('.govuk-radios').eq(0).should('contain.text','Yes');
       cy.get('.govuk-radios').children(1).should('contain.text','No');
       cy.get('form>.govuk-button').click();

      });

      checkErrorMessage('Has your meter reset or rolled over?');

      describe('selects No to meter reset', () => {
        cy.get('input[value="false"]').check();
        cy.get('form>.govuk-button').click();

      });   

  });
/*
  it('does not select a unit and clicks continue', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/div/fieldset/legend');
    expect(formQuestion).toHaveTextContaining('Which units are you using?');
    const label1 = getLabel('units');
    expect(label1).toHaveTextContaining('Cubic metres');
    const label2 = getLabel('units-2');
    expect(label2).toHaveTextContaining('Litres');
    const label3 = getLabel('units-3');
    expect(label3).toHaveTextContaining('Megalitres');
    const label4 = getLabel('units-4');
    expect(label4).toHaveTextContaining('Gallons');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Select a unit of measurement');

  it('selects cubic meters', () => {
    const radioButton = $('input[value="m³"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('enters no meter readings', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Enter your readings exactly as they appear on your meter');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Enter a meter start reading');

  it('enters a negaive meter reading', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Enter your readings exactly as they appear on your meter');
    const textBoxStart = $('input[name="startReading"]');
    textBoxStart.setValue('-1');
    const textBoxJan = $('input[name="2021-01-01_2021-01-31"]');
    textBoxJan.setValue('10');
    const textBoxFeb = $('input[name="2021-02-01_2021-02-28"]');
    textBoxFeb.setValue('20');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('This number should be positive');

  it('enters non incremental meter readings', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Enter your readings exactly as they appear on your meter');
    const textBoxStart = $('input[name="startReading"]');
    textBoxStart.setValue('10');
    const textBoxJan = $('input[name="2021-01-01_2021-01-31"]');
    textBoxJan.setValue('0'); // this can not be lower than the previous reading
    const textBoxFeb = $('input[name="2021-02-01_2021-02-28"]');
    textBoxFeb.setValue('20');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Reading should be higher than or equal to the start reading');

  it('selects cubic meters', () => {
    const textBoxStart = $('input[name="startReading"]');
    textBoxStart.setValue('0');
    const textBoxJan = $('input[name="2021-01-01_2021-01-31"]');
    textBoxJan.setValue('10');
    const textBoxFeb = $('input[name="2021-02-01_2021-02-28"]');
    textBoxFeb.setValue('20');
    const button = getButton();
    button.click();
  });

  it('enters the meter readings', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Your current meter details');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Enter the make of your meter');

  it('selects cubic meters', () => {
    const textBoxMake = $('input[name="manufacturer"]');
    textBoxMake.setValue('Test Water Meter');
    const textBoxSerialNumber = $('input[name="serialNumber"]');
    textBoxSerialNumber.setValue('Test serial number');
    const textBoxMultiplier = $('input[name="isMultiplier"]');
    textBoxMultiplier.click();
    const button = getButton();
    button.click();
  });

  it('confirms and submit the return details', () => {
    expect($('form')).toBeVisible();
    const pageSubHeader = $('//main/div/div/h2');
    expect(pageSubHeader).toHaveTextContaining('Confirm your return');
    const totalAbstracted = $('//table/tbody/tr[3]/td[3]/strong');
    expect(totalAbstracted).toHaveTextContaining('200');
    const button = getButton('Submit');
    button.click();
  });

  it('receives success confirmation for submitted return', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Return submitted');
  });
});
*/
/**
 * Nill return
 */
/*
describe('submit a nill return as an external user', () => {
  it('sees the page title', () => {
    const viewLicencesLink = $('*=View licences');
    viewLicencesLink.click();
    const title = getPageTitle();
    expect(title).toHaveText('Your licences');
  });

  it('sees the licences table', () => {
    const table = $('#results');
    expect(table).toBeVisible();
  });

  it('sees the three licences created by the setup routine', async () => {
    const table = await $('#results');
    await expect(table).toHaveTextContaining('AT/CURR/MONTHLY/02');
  });

  it('clicks on the MONTHLY licence 02', async () => {
    const dailyLicenceLink = await $('*=MONTHLY/02');
    await dailyLicenceLink.click();
    const licencePageHeader = await getPageTitle();
    await expect(licencePageHeader).toBeDisplayed();
    await expect(licencePageHeader).toHaveTextContaining('Licence number AT/CURR/MONTHLY/02');
  });

  it('sees the Summary table', async () => {
    const table = await $('#summary');
    expect(table).toBeVisible();
  });

  it('it clicks on the returns tab link', async () => {
    const returnsTabLink = await $('*=Returns');
    await returnsTabLink.click();
  });

  it('sees the returns table', async () => {
    const table = await $('#returns');
    expect(table).toBeVisible();
  });

  it('it clicks on the return id 9999990', () => {
    const returnsLink = $('*=9999990');
    returnsLink.click();
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Abstraction return');
    const caption = getPageCaption();
    expect(caption).toHaveTextContaining('Licence number AT/CURR/MONTHLY/02');
    expect($('form')).toBeVisible();
    const radioButton = $('input[value="true"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('confirms and submit the return details', () => {
    expect($('form')).toBeVisible();
    const pageSubHeader = $('//main/div/div/h2');
    expect(pageSubHeader).toHaveTextContaining('Nil return');
    const button = getButton('Submit');
    button.click();
  });

  it('receives success confirmation for submitted return', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Return submitted');
  });
});*/

/**
 * a helper method to complete
 * the returns flow up to selecting a unit of measure
 */
/*const completeFlowUntilUnits = () => {
  it('sees the page title', () => {
    const viewLicencesLink = $('*=View licences');
    viewLicencesLink.click();
    browser.pause(3000);
    const title = getPageTitle();
    expect(title).toHaveText('Your licences');
  });

  it('sees the licences table', () => {
    const table = $('#results');
    expect(table).toBeVisible();
  });

  it('sees the three licences created by the setup routine', () => {
    const table = $('#results');
    expect(table).toHaveTextContaining('AT/CURR/MONTHLY/02');
  });

  it('clicks on the MONTHLY licence 02', () => {
    const dailyLicenceLink = $('*=MONTHLY/02');
    dailyLicenceLink.click();
    const licencePageHeader = getPageTitle();
    expect(licencePageHeader).toBeDisplayed();
    expect(licencePageHeader).toHaveTextContaining('Licence number AT/CURR/MONTHLY/02');
  });

  it('sees the Summary table', () => {
    const table = $('#summary');
    expect(table).toBeVisible();
  });

  it('it clicks on the returns tab link', () => {
    const returnsTabLink = $('*=Returns');
    returnsTabLink.click();
  });

  it('sees the returns table', async () => {
    const table = await $('#returns');
    expect(table).toBeVisible();
  });

  it('it clicks on the return id 9999991', () => {
    const returnsLink = $('*=9999991');
    returnsLink.click();
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Abstraction return');
    const caption = getPageCaption();
    expect(caption).toHaveTextContaining('Licence number AT/CURR/MONTHLY/02');
    expect($('form')).toBeVisible();
  });

  it('selects yes for water has been abstracted in this period', () => {
    const radioButton1 = $('input[value="false"]');
    radioButton1.click();
    const button = getButton();
    button.click();
  });

  it('selects "Volumes from one or more meters"', () => {
    expect($('form')).toBeVisible();
    const radioButton2 = $('input[value="abstractionVolumes,measured"]');
    radioButton2.click();
    const button = getButton();
    button.click();
  });
};*/

/**
 * a helper method to set the monthly return volumes
 */
/*const setMonthlyReturnVolumes = (data) => {
  const textBoxJan = $('input[name="2020-01-01_2020-01-31"]');
  textBoxJan.setValue(data.jan);
  browser.pause(200);
  const textBoxFeb = $('input[name="2020-02-01_2020-02-29"]');
  textBoxFeb.setValue(data.feb);
  browser.pause(200);
  const textBoxMar = $('input[name="2020-03-01_2020-03-31"]');
  textBoxMar.setValue(data.mar);
  browser.pause(200);
  const textBoxApr = $('input[name="2020-04-01_2020-04-30"]');
  textBoxApr.setValue(data.apr);
  browser.pause(200);
  const textBoxMay = $('input[name="2020-05-01_2020-05-31"]');
  textBoxMay.setValue(data.may);
  browser.pause(200);
  const textBoxJun = $('input[name="2020-06-01_2020-06-30"]');
  textBoxJun.setValue(data.jun);
  browser.pause(200);
  const textBoxJul = $('input[name="2020-07-01_2020-07-31"]');
  textBoxJul.setValue(data.jul);
  browser.pause(200);
  const textBoxAug = $('input[name="2020-08-01_2020-08-31"]');
  textBoxAug.setValue(data.aug);
  browser.pause(200);
  const textBoxSep = $('input[name="2020-09-01_2020-09-30"]');
  textBoxSep.setValue(data.sep);
  browser.pause(200);
  const textBoxOct = $('input[name="2020-10-01_2020-10-31"]');
  textBoxOct.setValue(data.oct);
  browser.pause(200);
  const textBoxNov = $('input[name="2020-11-01_2020-11-30"]');
  textBoxNov.setValue(data.nov);
  browser.pause(200);
  const textBoxDec = $('input[name="2020-12-01_2020-12-31"]');
  textBoxDec.setValue(data.dec);
  browser.pause(200);
};*/

/**
 * submit return by volmes measured
 */
/*describe('submit a return by volumes as an external user', () => {
  completeFlowUntilUnits();

  describe('tests returns measured in litres', () => {
    it('selects litres as the unit measured', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/div/fieldset/legend');
      expect(formQuestion).toHaveTextContaining('Which units are you using?');
      const radioButton2 = $('input[value="l"]');
      radioButton2.click();
      const button = getButton();
      button.click();
    });

    it('enters negative volumes', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
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
      const button = getButton();
      button.click();
      browser.pause(3000);
    });

    checkErrorMessage('Enter an amount of 0 or above');*/

    /**
   * TESTS LITRES CALCULATIONS
   */
    /*it('enters the correct volumes', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
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
      const button = getButton();
      button.click();
      browser.pause(3000);
    });

    it('enters the meter details', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your current meter details');
      const textBoxMake = $('input[name="manufacturer"]');
      textBoxMake.setValue('Test Water Meter');
      const textBoxSerialNumber = $('input[name="serialNumber"]');
      textBoxSerialNumber.setValue('Test serial number');
      const textBoxMultiplier = $('input[name="isMultiplier"]');
      textBoxMultiplier.click();
      const button = getButton();
      button.click();
      browser.pause(5000);
    });

    it('confirms the total abstration volume calculated is correct', () => {
      expect($('form')).toBeVisible();
      const pageSubHeader = $('//main/div/div/h2');
      expect(pageSubHeader).toHaveTextContaining('Confirm your return');
      const totalAbstracted = $('//table/tbody/tr[13]/td[3]/strong');
      expect(totalAbstracted).toHaveTextContaining('120');
    });

    it('goes back to the change the volumes', () => {
      let back = getBackLink();
      back.click();
      browser.pause(3000);
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your current meter details');
      back = getBackLink();
      back.click();
      browser.pause(3000);
    });

    it('enters the volumes with some blank values', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
      const data = {
        jan: '10000',
        feb: '',
        mar: '10000',
        apr: '',
        may: '10000',
        jun: '',
        jul: '',
        aug: '10000',
        sep: '',
        oct: '',
        nov: '10000',
        dec: '10000'
      };
      setMonthlyReturnVolumes(data);
      const button = getButton();
      button.click();
      browser.pause(5000);
    });

    it('enters the meter details', () => {
      const form = $('form');
      expect(form).toBeVisible();
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your current meter details');
      const textBoxMake = $('input[name="manufacturer"]');
      textBoxMake.setValue('Test Water Meter');
      browser.pause(2000);
      const textBoxSerialNumber = $('input[name="serialNumber"]');
      textBoxSerialNumber.setValue('Test serial number');
      browser.pause(2000);
      const button = getButton();
      button.click();
      browser.pause(2000);
    });

    it('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
      expect($('form')).toBeVisible();
      const pageSubHeader = $('//main/div/div/h2');
      expect(pageSubHeader).toHaveTextContaining('Confirm your return');
      const totalAbstracted = $('//table/tbody/tr[13]/td[3]/strong');
      expect(totalAbstracted).toHaveTextContaining('60');
    });
  });*/

  /**
   * TESTS GALLONS
   */
 /* describe('tests returns measured in gallons', () => {
    completeFlowUntilUnits();

    it('selects gallons as the unit measured', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/div/fieldset/legend');
      expect(formQuestion).toHaveTextContaining('Which units are you using?');
      const radioButton = $('input[value="gal"]');
      radioButton.click();
      browser.pause(3000);
      const button = getButton();
      button.click();
      browser.pause(3000);
    });

    it('enters the volumes with some blank values', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
      const data = {
        jan: '1',
        feb: '1',
        mar: '1',
        apr: '1',
        may: '1',
        jun: '',
        jul: '',
        aug: '1',
        sep: '',
        oct: '1',
        nov: '',
        dec: '1'
      };
      setMonthlyReturnVolumes(data);
      const button = getButton();
      browser.pause(1000);
      button.click();
      browser.pause(3000);
    });

    it('enters the meter details', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your current meter details');
      const textBoxMake = $('input[name="manufacturer"]');
      textBoxMake.setValue('Test Water Meter');
      browser.pause(1000);
      const textBoxSerialNumber = $('input[name="serialNumber"]');
      textBoxSerialNumber.setValue('Test serial number');
      browser.pause(1000);
      const button = getButton();
      button.click();
      browser.pause(3000);
    });

    it('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
      expect($('form')).toBeVisible();
      const pageSubHeader = $('//main/div/div/h2');
      expect(pageSubHeader).toHaveTextContaining('Confirm your return');
      const totalAbstracted = $('//table/tbody/tr[13]/td[3]/strong');
      expect(totalAbstracted).toHaveTextContaining('0.036');
      browser.pause(3000);
    });
  });*/

  // /**
  //  *  TESTS MEGA LITRES
  //  */
  /*describe('tests returns measured in mega litres', () => {
    completeFlowUntilUnits();

    it('selects litres as the unit measured', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/div/fieldset/legend');
      expect(formQuestion).toHaveTextContaining('Which units are you using?');
      const radioButton = $('[value="Ml"]');
      radioButton.click();
      browser.pause(500);
      const button = getButton();
      button.click();
      browser.pause(3000);
    });

    it('enters the volumes with some blank values', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
      const data = {
        jan: '1',
        feb: '1',
        mar: '1',
        apr: '1',
        may: '1',
        jun: '',
        jul: '',
        aug: '1',
        sep: '',
        oct: '1',
        nov: '',
        dec: '1'
      };
      setMonthlyReturnVolumes(data);
      const button = getButton();
      browser.pause(1000);
      button.click();
      browser.pause(3000);
    });

    it('enters the meter details', () => {
      expect($('form')).toBeVisible();
      const formQuestion = $('//form/p');
      expect(formQuestion).toHaveTextContaining('Your current meter details');
      const textBoxMake = $('input[name="manufacturer"]');
      textBoxMake.setValue('Test Water Meter');
      const textBoxSerialNumber = $('input[name="serialNumber"]');
      textBoxSerialNumber.setValue('Test serial number');
      const button = getButton();
      browser.pause(3000);
      button.click();
      browser.pause(3000);
    });

    it('confirms the correct total abstracted has been calculated with blank values for volumes entered', () => {
      expect($('form')).toBeVisible();
      const pageSubHeader = $('//main/div/div/h2');
      expect(pageSubHeader).toHaveTextContaining('Confirm your return');
      const totalAbstracted = $('//table/tbody/tr[13]/td[3]/strong');
      expect(totalAbstracted).toHaveTextContaining('8,000');
      const button = getButton('Submit');
      browser.pause(3000);
      button.click();
      browser.pause(3000);
    });

    it('receives success confirmation for submitted return', () => {
      const pageTitle = getPageTitle();
      expect(pageTitle).toHaveTextContaining('Return submitted');
    });
  });*/
});
