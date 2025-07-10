import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'session',
        loadComponent: () =>
          import('../components/session/session.component').then(
            (m) => m.SessionComponent
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/session',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/session',
    pathMatch: 'full',
  },
];
