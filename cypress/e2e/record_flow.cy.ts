/// <reference types="cypress" />

describe('Basic Recording Flow', () => {
  it('should record a complete session with a manual note', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();

    cy.get('ion-fab-button').click();

    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert input.alert-input').type('Test manual note');
    cy.get('ion-alert button.alert-button:not(.alert-button-role-cancel)').click();

    cy.contains('End Climbing').click();

    cy.url().should('include', '/tabs/home');

    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on');

    cy.get('.session-cards ion-card').first()
      .trigger('mousedown')
      .wait(1000) // Wait for long press duration

    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();

    cy.get('.session-cards ion-card-title')
      .should('contain', 'No sessions recorded yet');
  });

  it('should record a session with multiple manual notes', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();

    // Add 10 manual notes
    for(let i = 1; i <= 10; i++) {
      cy.get('ion-fab-button').click();
      cy.get('ion-alert').should('be.visible');
      cy.get('ion-alert input.alert-input').first().type(`Test manual note ${i}`);
      cy.get('ion-alert button.alert-button:not(.alert-button-role-cancel)').click();
      // Wait for the alert to disappear before continuing
      cy.get('ion-alert').should('not.exist');
    }

    cy.contains('End Climbing').click();

    cy.url().should('include', '/tabs/home');

    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on');

    // Open session details and verify events
    cy.get('.session-cards ion-card').first().click();
    cy.get('.event-list .event-item').should('have.length', 12);

    cy.get('ion-fab-button[color="danger"]').click();

    cy.get('.session-cards ion-card').first()
      .trigger('mousedown')
      .wait(1000) // Wait for long press duration

    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();

    cy.get('.session-cards ion-card-title')
      .should('contain', 'No sessions recorded yet');
  });
});


