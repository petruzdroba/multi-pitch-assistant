import { LogService } from 'src/app/services/log.service';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

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

@Component({
  standalone: true,
  selector: 'app-add-event-modal',
  templateUrl: 'add-event-modal.component.html',
  styleUrls: ['add-event-modal.component.css'],
  imports: [
    FormsModule,
    DatePipe,
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
export class AddEventModalComponent implements OnInit {
  @Input() sessionId: string | undefined;
  newEvent: ClimbEvent = {
    id: crypto.randomUUID(),
    time: new Date(),
    type: 'manual-note',
    altitude: undefined,
    notes: '',
  };

  private logService = inject(LogService);

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.sessionId) {
      const session = this.logService.getSessionById(this.sessionId);
      if (session) {
        // Set the initial time to the session's start time
        this.newEvent.time = new Date(session.timeStart);
      }
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  onTimeChange(event: any) {
    if (event.detail.value) {
      const [hours, minutes] = event.detail.value.split(':').map(Number);
      // Keep the same date but update hours and minutes
      const newTime = new Date(this.newEvent.time);
      newTime.setHours(hours, minutes);
      this.newEvent.time = newTime;
    }
  }

  confirm() {
    if (!this.sessionId) return;
    this.logService.addEvent(this.newEvent, this.sessionId);
    return this.modalCtrl.dismiss(this.newEvent, 'confirm');
  }
}
