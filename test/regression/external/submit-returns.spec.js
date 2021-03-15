'use strict';

const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getPageTitle, getPageCaption, getButton, getLabel, getBackLink, getValidationSummaryMessage } = require('../shared/helpers/page');
const { setUp, tearDown } = require('../shared/helpers/setup');
const EMAIL_ADDRESS = userEmails.external;

/* eslint-disable no-undef */
/**
 * helper method to test the error messages of a form
 * @param {*} message error message expected on the form
 */
const checkErrorMessage = (message) => {
  it('it sees the correct error message', () => {
    const errorSummary = getValidationSummaryMessage();
    expect(errorSummary).toHaveTextContaining(message);
  });
};

/**
 * submit meter readings for the rturn
 */
describe('submit a return metered readings return as an external user', () => {
  before(async () => {
    await tearDown();
    await setUp('barebones');
    await loginAsUser(baseUrl, EMAIL_ADDRESS);
  });

  it('sees the page title', async () => {
    const title = await getPageTitle();

    expect(title).toHaveText('Your licences');
  });

  it('sees the licences table', async () => {
    const table = await $('#results');

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

  it('it clicks on the return id 9999992 to start the returns flow', () => {
    const returnsLink = $('*=9999992');
    returnsLink.click();
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Abstraction return');
    const caption = getPageCaption().getText();
    expect(caption).toEqual('Licence number AT/CURR/MONTHLY/02');
    expect($('form')).toBeVisible();
    const radioLabel1 = getLabel('isNil');
    expect(radioLabel1).toHaveTextContaining('Yes');
    const radioLabel2 = getLabel('isNil-2');
    expect(radioLabel2).toHaveTextContaining('No');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Has any water been abstracted?');

  it('selects yes - water has been abstracted', () => {
    const radioButton = $('input[value="false"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('selects no option for "How are you reporting your figures"', () => {
    expect($('form')).toBeVisible();
    const radioLabel1 = getLabel('method');
    expect(radioLabel1).toHaveTextContaining('Readings from a single meter');
    const radioLabel2 = getLabel('method-2');
    expect(radioLabel2).toHaveTextContaining('Volumes from one or more meters');
    const radioLabel3 = getLabel('method-3');
    expect(radioLabel3).toHaveTextContaining('Estimates without a meter');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Select readings from one meter, or other (abstraction volumes)');

  it('selects "Readings from a single meter"', () => {
    const radioButton = $('input[value="oneMeter,measured"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('selects no option for "Did your meter reset in this abstraction period?"', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/div/fieldset/legend');
    expect(formQuestion).toHaveTextContaining('Did your meter reset in this abstraction period?');
    const label1 = getLabel('meterReset');
    expect(label1).toHaveTextContaining('Yes');
    const label2 = getLabel('meterReset-2');
    expect(label2).toHaveTextContaining('No');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Has your meter reset or rolled over?');

  it('selects No to meter reset', () => {
    const radioButton = $('input[value="false"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

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

/**
 * Nill return
 */
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
});

/**
 * a helper method to complete
 * the returns flow up to selecting a unit of measure
 */
const completeFlowUntilUnits = () => {
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
};

/**
 * a helper method to set the monthly return volumes
 */
const setMonthlyReturnVolumes = (data) => {
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
};

/**
 * submit return by volmes measured
 */
describe('submit a return by volumes as an external user', () => {
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

    checkErrorMessage('Enter an amount of 0 or above');

    /**
   * TESTS LITRES CALCULATIONS
   */
    it('enters the correct volumes', () => {
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
  });

  /**
   * TESTS GALLONS
   */
  describe('tests returns measured in gallons', () => {
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
  });

  // /**
  //  *  TESTS MEGA LITRES
  //  */
  describe('tests returns measured in mega litres', () => {
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
  });
});
