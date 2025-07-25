import { LogService } from 'src/app/services/log.service';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ModalController } from '@ionic/angular/standalone';
import { ClimbEvent } from 'src/app/models/climb-event.interface';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-modal-example',
  templateUrl: 'edit-event-modal.component.html',
  imports: [FormsModule, IonicModule],
})
export class EditEventModalComponent implements OnInit {
  @Input() event: ClimbEvent | undefined;
  @Input() sessionId: string | undefined;
  editableEvent!: ClimbEvent;

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
