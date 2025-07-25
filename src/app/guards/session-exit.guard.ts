import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SessionExitGuard implements CanDeactivate<CanComponentDeactivate> {
  constructor(private alertCtrl: AlertController) {}

  async canDeactivate(component: CanComponentDeactivate): Promise<boolean> {
    if (component.canDeactivate) {
      const canLeave = await component.canDeactivate();
      if (canLeave) return true;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirm Exit',
      message: 'Are you sure you want to end the session?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {},
        },
        {
          text: 'End Session',
          handler: () => {},
        },
      ],
    });

    await alert.present();

    // Wait for user response
    return new Promise((resolve) => {
      alert.onDidDismiss().then(({ role }) => {
        resolve(role === 'cancel' ? false : true);
      });
    });
  }
}
