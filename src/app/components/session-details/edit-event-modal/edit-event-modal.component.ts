import { LogService } from 'src/app/services/log.service';
import { Component, inject, Input, NgModule, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';

import {
  IonSelectOption,
  IonSelect,
  ModalController,
  IonItem,
  IonLabel,
  IonContent,
  IonButton,
  IonTitle,
  IonButtons,
  IonToolbar,
  IonTextarea,
  IonInput,
  IonHeader,
} from '@ionic/angular/standalone';
import { ClimbEvent } from 'src/app/models/climb-event.interface';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-modal-example',
  templateUrl: 'edit-event-modal.component.html',
  imports: [
    FormsModule,
    // IonicModule,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonContent,
    IonButton,
    IonTitle,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonTextarea,
    IonInput,
  ],
})
export class EditEventModalComponent implements OnInit {
  @Input() event: ClimbEvent | undefined;
  @Input() sessionId: string | undefined;
  editableEvent: ClimbEvent = {
    id: 'asd',
    time: new Date(),
    type: 'error',
    altitude: 0,
    notes: '',
    // ... initialize all required ClimbEvent fields with sensible defaults here
  };

  private logService = inject(LogService);

  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    console.log('event passed to modal:', this.event);
    if (this.event) {
      this.editableEvent = { ...this.event };
    } else {
      console.error('No event passed to modal');
      this.cancel();
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.editableEvent || !this.sessionId) return;
    this.logService.updateEvent(this.editableEvent, this.sessionId);
    return this.modalCtrl.dismiss(this.editableEvent, 'confirm');
  }
}
