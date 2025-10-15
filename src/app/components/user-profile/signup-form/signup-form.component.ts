import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IonInput, IonItem } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.css'],
  imports: [IonItem, IonInput, ReactiveFormsModule],
})
export class SignupFormComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscription?: Subscription;

  protected form = new FormGroup({
    username: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl<string>('', {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
      ],
    }),
    confirmPassword: new FormControl<string>('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
      ],
    }),
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      this.form.markAllAsTouched();
      return;
    }

    const userData = {
      username: username!,
      email: email!,
      password: password!,
    };

    this.subscription = this.authService.signUp(userData).subscribe({
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

    this.form.reset();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
