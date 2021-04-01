describe('User Login',() => {
    it('Try to login', () => { 
//cy.visit to visit the URL 
cy.visit('')

//Enter the user name and Password 
cy.get('#email').type(Cypress.env('Uname'))
cy.get('#password').type(Cypress.env('Pwd'))

//Click Sign in Button 
cy.get ('.govuk-button.govuk-button--start').click()  

//assert once the user is signed in
cy.contains ('Licences, users and returns')

//search for a license 
cy.get ('#query').type('Anglian').should('be.visible')

cy.get ('.search__button').click()
cy.contains ('Licences')

 

})

})