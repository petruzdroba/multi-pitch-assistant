import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent],
})
export class UserProfileComponent {
  private authService = inject(AuthService)

  get isLoggedIn(){
    return this.authService.isLoggedIn()
  }
}
