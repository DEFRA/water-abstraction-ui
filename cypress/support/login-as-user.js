/* eslint-disable no-undef */

Cypress.Commands.add('loginAsUser', (userEmail) => {
  try {
    //cy.visit(Cypress.env('baseUrl'));
    cy.get('input#email').setValue(userEmail);

    cy.get('#password').setValue('P@55word');
    cy.get('.govuk-button.govuk-button--start').click();

    
  } catch (err) {
    console.log(err);
  }
};

//exports.loginAsUser = loginAsUser;
