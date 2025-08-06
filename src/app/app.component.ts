import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  styleUrls: ['app.component.css'],
  standalone: true,
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private db = inject(DatabaseService);
  dbReady = false;
  error: string | null = null;

  async ngOnInit() {
    try {
      await this.db.init();
      this.dbReady = true;
    } catch (err: any) {
      this.error = 'Failed to initialize database';
      console.error(err);
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const appElement = document.querySelector('ion-app');
        if (!appElement) return;

        // Remove old bg classes
        this.renderer.removeClass(appElement, 'bg-home');
        this.renderer.removeClass(appElement, 'bg-log');
        this.renderer.removeClass(appElement, 'bg-session');

        // Add new bg class
        if (event.url.includes('/tabs/home')) {
          this.renderer.addClass(appElement, 'bg-home');
        } else if (
          event.url.includes('/tabs/log') ||
          event.url.includes('/tabs/session-details')
        ) {
          this.renderer.addClass(appElement, 'bg-log');
        } else if (event.url.includes('/tabs/session')) {
          this.renderer.addClass(appElement, 'bg-session');
        } else {
          this.renderer.addClass(appElement, 'bg-home');
          // fallback
        }
      });
  }
}
