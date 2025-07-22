import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { recordingGuard } from '../guards/recording.guard';
import { SessionExitGuard } from '../guards/session-exit.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('../components/home-screen/home-screen.component').then(
            (m) => m.HomeScreenComponent
          ),
      },
      {
        path: 'session',
        canActivate: [recordingGuard],
        canDeactivate: [SessionExitGuard],
        loadComponent: () =>
          import('../components/session/session.component').then(
            (m) => m.SessionComponent
          ),
      },
      {
        path: 'log',
        loadComponent: () =>
          import('../components/log/log.component').then((m) => m.LogComponent),
      },
      {
        path: 'session-details/:id',
        loadComponent: () =>
          import(
            '../components/session-details/session-details.component'
          ).then((m) => m.SessionDetailsComponent),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
