/// <reference types="cypress" />

describe('Edit Flow', () => {
  it('should edit name of a recorded session', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();

    cy.get('ion-fab-button').click();

    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert input.alert-input').type('Test manual note');
    cy.get(
      'ion-alert button.alert-button:not(.alert-button-role-cancel)'
    ).click();

    cy.contains('End Climbing').click();

    cy.url().should('include', '/tabs/home');

    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title')
      .should('contain', 'Climb on')
      .click();

    cy.get('ion-input.glass-input').type('My Test Session');

    cy.get('.btn-submit ion-fab-button ion-icon[name="checkmark"]')
      .parent()
      .click();

    cy.get('.session-cards ion-card-title').should(
      'contain',
      'My Test Session'
    );

    cy.get('.session-cards ion-card').first().trigger('mousedown').wait(1000);

    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive')
      .contains('Delete')
      .click();

    cy.get('.session-cards ion-card-title').should(
      'contain',
      'No sessions recorded yet'
    );
  });


});
