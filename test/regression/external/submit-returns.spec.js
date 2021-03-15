'use strict';

const { loginAsUser } = require('../shared/helpers/login-as-user');
const { baseUrl, userEmails } = require('./config');
const { getPageTitle, getPageCaption, getButton, getLabel } = require('../shared/helpers/page');
const { setUp, tearDown } = require('../shared/helpers/setup');
const EMAIL_ADDRESS = userEmails.external;

/* eslint-disable no-undef */
/**
 * helper method to test the error messages of a form
 * @param {*} message error message expected on the form
 */
const checkErrorMessage = (message) => {
  it('it sees the correct error message', () => {
    const errorSummary = $('.govuk-error-summary');
    const errorSummaryTitle = $('.govuk-error-summary__title');
    const errorSummaryBody = $('.govuk-error-summary__body');
    expect(errorSummary).toBeVisible();
    expect(errorSummaryTitle).toHaveText('There is a problem');
    expect(errorSummaryBody).toHaveTextContaining(message);
  });
};

/**
 * submit meter readings for the rturn
 */
describe('submit a return metered readings return as an external user', function () {
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

  it('How are you reporting your figures', () => {
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

  it('selects Readings from a single meter', () => {
    const radioButton = $('[value="oneMeter,measured"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('answers yes to Did your meter reset in this abstraction period?', () => {
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
    const radioButton = $('[value="false"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('selects cubic meters as the unit measured', () => {
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
    const radioButton = $('[value="m³"]');
    radioButton.click();
    const button = getButton();
    button.click();
  });

  it('enters the meter readings', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Enter your readings exactly as they appear on your meter');
    const button = getButton();
    button.click();
  });

  checkErrorMessage('Enter a meter start reading');

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
describe('submit a nill return as an external user', function () {
  it('sees the page title', async () => {
    const viewLicencesLink = await $('*=View licences');
    await viewLicencesLink.click();
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

  it('it clicks on the return id 9999990', () => {
    const returnsLink = $('*=9999990');
    returnsLink.click();
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Abstraction return');
    const caption = getPageCaption();
    expect(caption).toHaveTextContaining('Licence number AT/CURR/MONTHLY/02');
    expect($('form')).toBeVisible();
    const radioButton = $('[value="true"]');
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
 * submit return by volmes measured
 */
describe('submit a return by volumes as an external user', function () {
  it('sees the page title', async () => {
    const viewLicencesLink = await $('*=View licences');
    await viewLicencesLink.click();
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
    const radioButton1 = $('[value="false"]');
    radioButton1.click();
    const button = getButton();
    button.click();
  });

  it('selects "Volumes from one or more meters"', () => {
    expect($('form')).toBeVisible();
    const radioButton2 = $('[value="abstractionVolumes,measured"]');
    radioButton2.click();
    const button = getButton();
    button.click();
  });

  it('selects litres as the unit measured', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/div/fieldset/legend');
    expect(formQuestion).toHaveTextContaining('Which units are you using?');
    const radioButton2 = $('[value="l"]');
    radioButton2.click();
    const button = getButton();
    button.click();
  });

  it('enters the meter readings', () => {
    expect($('form')).toBeVisible();
    const formQuestion = $('//form/p');
    expect(formQuestion).toHaveTextContaining('Your abstraction volumes');
    const textBoxJan = $('input[name="2020-01-01_2020-01-31"]');
    textBoxJan.setValue('10000');
    const textBoxFeb = $('input[name="2020-02-01_2020-02-29"]');
    textBoxFeb.setValue('10000');
    const textBoxMar = $('input[name="2020-03-01_2020-03-31"]');
    textBoxMar.setValue('10000');
    const textBoxApr = $('input[name="2020-04-01_2020-04-30"]');
    textBoxApr.setValue('10000');
    const textBoxMay = $('input[name="2020-05-01_2020-05-31"]');
    textBoxMay.setValue('10000');
    const textBoxJun = $('input[name="2020-06-01_2020-06-30"]');
    textBoxJun.setValue('10000');
    const textBoxJul = $('input[name="2020-07-01_2020-07-31"]');
    textBoxJul.setValue('10000');
    const textBoxAug = $('input[name="2020-08-01_2020-08-31"]');
    textBoxAug.setValue('10000');
    const textBoxSep = $('input[name="2020-09-01_2020-09-30"]');
    textBoxSep.setValue('10000');
    const textBoxOct = $('input[name="2020-10-01_2020-10-31"]');
    textBoxOct.setValue('10000');
    const textBoxNov = $('input[name="2020-11-01_2020-11-30"]');
    textBoxNov.setValue('10000');
    const textBoxDec = $('input[name="2020-12-01_2020-12-31"]');
    textBoxDec.setValue('10000');
    const button = getButton();
    button.click();
  });

  it('enters the meter readings', () => {
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
  });

  it('confirms and submit the return details', () => {
    expect($('form')).toBeVisible();
    const pageSubHeader = $('//main/div/div/h2');
    expect(pageSubHeader).toHaveTextContaining('Confirm your return');
    const totalAbstracted = $('//table/tbody/tr[13]/td[3]/strong');
    expect(totalAbstracted).toHaveTextContaining('120');
    const button = getButton('Submit');
    button.click();
  });

  it('receives success confirmation for submitted return', () => {
    const pageTitle = getPageTitle();
    expect(pageTitle).toHaveTextContaining('Return submitted');
  });
});
