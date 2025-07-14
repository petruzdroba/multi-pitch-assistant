import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

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
        loadComponent: () =>
          import('../components/session/session.component').then(
            (m) => m.SessionComponent
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
