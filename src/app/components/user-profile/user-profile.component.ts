import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent } from "@ionic/angular/standalone";
import { LoginFormComponent } from "./login-form/login-form.component";
import { SignupFormComponent } from "./signup-form/signup-form.component";

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonSegmentView, IonSegmentContent, LoginFormComponent, SignupFormComponent],
})
export class UserProfileComponent {
  private authService = inject(AuthService)

  get isLoggedIn(){
    return this.authService.isLoggedIn()
  }
}
