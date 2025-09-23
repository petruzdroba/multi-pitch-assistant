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

  it('should add events on demand', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();
    cy.contains('End Climbing').click();

    cy.url().should('include', '/tabs/home');

    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title')
      .should('contain', 'Climb on')
      .click();

    cy.get(
      'ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button'
    ).click();

    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('rest').click();
    cy.get('ion-alert .alert-button').contains('OK').click();

    cy.get('ion-input[type="number"]').type('1234');

    cy.get('ion-textarea').type('Taking a break at pitch 2');

    cy.contains('ion-button', 'Confirm').click();

    cy.get('.event-list .event-item .event-type').should('contain', 'rest');
    cy.get('.event-list .event-item .event-altitude').should(
      'contain',
      '1,234.00 m'
    );

    cy.get('ion-fab-button[color="danger"]').click();
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
