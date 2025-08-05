import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

import { inject } from '@angular/core';
import { DatabaseService } from './app/services/database.service';

addIcons({ ...allIcons });

async function initializeDatabase() {
  const dbService = inject(DatabaseService);
  try {
    await dbService.init();
    console.log('Database initialized');
  } catch (e) {
    console.error('Database init failed:', e);
  }
}

// Call init before bootstrap
await initializeDatabase();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
