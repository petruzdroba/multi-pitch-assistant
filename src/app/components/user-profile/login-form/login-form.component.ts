import { Component, inject, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonItem, IonInput } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  imports: [IonItem, IonInput, ReactiveFormsModule],
})
export class LoginFormComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscription?: Subscription;

  protected form = new FormGroup({
    email: new FormControl<string>('', {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      validators: [Validators.required],
    }),
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.email && this.form.value.password) {
      const userData = {
        email: this.form.value.email,
        password: this.form.value.password,
      };

      this.subscription = this.authService.logIn(userData).subscribe({
        next: (response) => {
          this.form.reset();
          this.router.navigate(['/tabs/home']);
        },
        error: (error) => {
          this.form.markAllAsTouched();
          Object.keys(this.form.controls).forEach((key) => {
            this.form.get(key)?.setErrors({ invalid: true });
          });
        },
      });
    }

    this.form.reset();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
