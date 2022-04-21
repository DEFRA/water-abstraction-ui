const checkInlineAndSummaryErrorMessage = (expectedMessage) => {
    cy.get('.govuk-error-summary__list').contains(expectedMessage);
    cy.get('.govuk-error-message').contains(expectedMessage);
};

const checkNoErrorMessage = () => {
    cy.get('.govuk-error-summary__list').should('not.exist');
    cy.get('.govuk-error-message').should('not.exist');
}

const validateRadioOptions = (title, selector, errorMessage) => {
    cy.get('.govuk-heading-l').contains(title);
    describe('user clicks continue without choosing an option', () => {
        cy.get('form > .govuk-button').contains('Continue').click();
        checkInlineAndSummaryErrorMessage(errorMessage);
        cy.reload();
    });
    describe('user selects option', () => {
        cy.get(`[type="radio"]#${selector}`).click();
        cy.get('form > .govuk-button').contains('Continue').click();
    });
};

const validateRadioOptionsNthChild1 = (title, selector, errorMessage) => {
    cy.get('.govuk-heading-l').contains(title);
    describe('user clicks continue without choosing an option', () => {
        cy.get('form > .govuk-button').contains('Continue').click();
        checkInlineAndSummaryErrorMessage(errorMessage);
        cy.reload();
    });
    describe('user selects option', () => {
        cy.get(`.govuk-radios > :nth-child(1) > #${selector}`).click();
        cy.get('form > .govuk-button').contains('Continue').click();
    });
};

module.exports = {
    checkInlineAndSummaryErrorMessage,
    checkNoErrorMessage,
    validateRadioOptions,
    validateRadioOptionsNthChild1
}