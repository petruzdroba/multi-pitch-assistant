import { AuthService } from 'src/app/services/auth.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { UserData } from 'src/app/models/user-data.interface';
import { IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.css'],
  imports: [IonItem, IonLabel, IonInput],
})
export class UserDataComponent implements OnInit {
  private authService = inject(AuthService);
  protected userData = signal<UserData>({} as UserData);
  private router = inject(Router);

  ngOnInit() {
    this.userData.set(this.authService.user() || ({} as UserData));
  }

  onDelete() {}

  onLogout() {
    this.authService.logOut();
    this.router.navigate(['/tabs/home']);
  }
}
