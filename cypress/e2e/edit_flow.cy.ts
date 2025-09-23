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

  it('should add event on demand', () => {
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

  it('should perform a name change and multiple event adding', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();
    cy.contains('End Climbing').click();

    cy.url().should('include', '/tabs/home');
    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on').click();

    // Change session name
    cy.get('ion-input.glass-input').type('Complete Test Session');
    cy.get('.btn-submit ion-fab-button ion-icon[name="checkmark"]').parent().click();

    cy.get('.session-cards ion-card-title').should('contain', 'Complete Test Sessio');

    // Click to open session details again
    cy.get('.session-cards ion-card').first().click();
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('rest').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1000');
    cy.get('ion-textarea').type('First rest stop');
    cy.contains('ion-button', 'Confirm').click();

    // Add second event - pitch changed
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('pitch-changed').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1200');
    cy.get('ion-textarea').type('Moving to pitch 2');
    cy.contains('ion-button', 'Confirm').click();

    // Add third event - fall
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('fall').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1250');
    cy.get('ion-textarea').type('Small fall on pitch 2');
    cy.contains('ion-button', 'Confirm').click();

    // Verify all events exist
    cy.get('.event-list .event-item .event-type').should('contain', 'rest');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,000.00 m');
    cy.get('.event-list .event-item .event-type').should('contain', 'pitch-changed');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,200.00 m');
    cy.get('.event-list .event-item .event-type').should('contain', 'fall');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,250.00 m');

    // Return to log and delete session
    cy.get('ion-fab-button[color="danger"]').click();
    cy.get('.session-cards ion-card').first().trigger('mousedown').wait(1000);
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();
    cy.get('.session-cards ion-card-title').should('contain', 'No sessions recorded yet');
  });

  it('should edit an added event', () => {
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
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on').click();

    // Swipe to reveal edit button (using touch events)
    cy.get('ion-item-sliding').first()
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchend');

    // Click edit button (force because item-options are hidden by default)
    cy.get('ion-item-sliding').first().within(() => {
      cy.get('ion-item-option.glass-swipe.medium').click({ force: true });
    });

    // Edit the event
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('rest').click();
    cy.get('ion-alert .alert-button').contains('OK').click();

    cy.get('ion-input[type="number"]').type('1500');
    cy.get('ion-textarea').clear().type('Updated note text');

    // Save changes
    cy.contains('ion-button', 'Confirm').click();

    // Verify changes
    cy.get('.event-list .event-item .event-type').should('contain', 'rest');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,500.00 m');

    cy.get('ion-fab-button[color="danger"]').click();
    cy.get('.session-cards ion-card').first().trigger('mousedown').wait(1000);
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();
    cy.get('.session-cards ion-card-title').should('contain', 'No sessions recorded yet');
  });

  it('should delete an added event', () => {
    cy.visit('/');
    cy.contains('Start Climbing').click();

    // Add an event to delete later
    cy.get('ion-fab-button').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert input.alert-input').type('Event to delete');
    cy.get('ion-alert button.alert-button:not(.alert-button-role-cancel)').click();

    cy.contains('End Climbing').click();

    // Navigate to session
    cy.url().should('include', '/tabs/home');
    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card').should('exist');
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on').click();

    // Verify event exists before deletion
    cy.get('.event-list .event-item .event-type').should('contain', 'manual-note');

    // Get the first item and store it as an alias
    cy.get('ion-item-sliding').first().as('itemToDelete');

    // Swipe to reveal delete button (using touch events)
    cy.get('@itemToDelete')
      .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchend');

    // Wait for the swipe animation to complete
    cy.wait(500);

    // Click delete button within the item's options
    cy.get('@itemToDelete')
      .find('ion-item-options ion-item-option.glass-swipe.danger')
      .click({ force: true });

    // Verify event is deleted (should only see start and end events)
    cy.get('.event-list .event-item .event-type').should('not.contain', 'manual-note');

    // Clean up - delete session
    cy.get('ion-fab-button[color="danger"]').click();
    cy.get('.session-cards ion-card').first().trigger('mousedown').wait(1000);
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();
    cy.get('.session-cards ion-card-title').should('contain', 'No sessions recorded yet');
  });

  it('should perform a complex session workflow with multiple operations', () => {
    // Start session with initial note
    cy.visit('/');
    cy.contains('Start Climbing').click();
    cy.get('ion-fab-button').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert input.alert-input').type('Initial note');
    cy.get('ion-alert button.alert-button:not(.alert-button-role-cancel)').click();
    cy.contains('End Climbing').click();

    // Navigate to session and rename it
    cy.url().should('include', '/tabs/home');
    cy.get('ion-tab-button').contains('Log').click();
    cy.get('.session-cards ion-card-title').should('contain', 'Climb on').click();
    cy.get('ion-input.glass-input').type('Complex Test Session');
    cy.get('.btn-submit ion-fab-button ion-icon[name="checkmark"]').parent().click();
    cy.get('.session-cards ion-card-title').should('contain', 'Complex Test Session').click();

    // Add first event - rest
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('rest').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1000');
    cy.get('ion-textarea').type('First rest stop');
    cy.contains('ion-button', 'Confirm').click();

    // Add second event - pitch changed
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('pitch-changed').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1200');
    cy.get('ion-textarea').type('Moving to pitch 2');
    cy.contains('ion-button', 'Confirm').click();

    // Edit the first rest event
    // Get the first item and store it as an alias
    cy.get('ion-item-sliding').first().as('firstItem');

    // Trigger swipe on the aliased item
    cy.get('@firstItem')
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchend');

    // Wait for the swipe animation to complete
    cy.wait(500);

    // Click the edit button within the first item's options
    cy.get('@firstItem')
      .find('ion-item-options ion-item-option.glass-swipe.medium')
      .click({ force: true });

    // Update its details
    cy.get('ion-input[type="number"]').clear().type('1100');
    cy.get('ion-textarea').clear().type('Extended rest at pitch 1');
    cy.contains('ion-button', 'Confirm').click();

    // Add a fall event
    cy.get('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    cy.get('ion-select').click();
    cy.get('ion-alert').should('be.visible');
    cy.get('.alert-radio-group .alert-radio-button').contains('fall').click();
    cy.get('ion-alert .alert-button').contains('OK').click();
    cy.get('ion-input[type="number"]').type('1250');
    cy.get('ion-textarea').type('Small fall on pitch 2');
    cy.contains('ion-button', 'Confirm').click();

    // Delete the pitch-changed event
    // Get the second item and store it as an alias
    cy.get('ion-item-sliding').eq(1).as('secondItem');

    // Trigger swipe on the aliased item
    cy.get('@secondItem')
      .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchend');

    // Wait for the swipe animation to complete
    cy.wait(500);

    // Click the delete button within the second item's options
    cy.get('@secondItem')
      .find('ion-item-options ion-item-option.glass-swipe.danger')
      .click({ force: true });

    // Verify final state
    // Should have rest event with updated altitude
    cy.get('.event-list .event-item .event-type').should('contain', 'rest');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,100.00 m');
    // Should have fall event
    cy.get('.event-list .event-item .event-type').should('contain', 'fall');
    cy.get('.event-list .event-item .event-altitude').should('contain', '1,250.00 m');
    // Should NOT have pitch-changed event anymore
    cy.get('.event-list .event-item .event-type').should('not.contain', 'pitch-changed');

    // Final cleanup
    cy.get('ion-fab-button[color="danger"]').click();
    cy.get('.session-cards ion-card').first().trigger('mousedown').wait(1000);
    cy.get('ion-alert').should('be.visible');
    cy.get('ion-alert .alert-button-role-destructive').contains('Delete').click();
    cy.get('.session-cards ion-card-title').should('contain', 'No sessions recorded yet');
  });
});
