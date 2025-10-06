import { computed, inject, Injectable, signal } from '@angular/core';
import { UserData } from '../models/user-data.interface';
import { map, Observable, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.test';
import { Storage } from '@capacitor/storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userData = signal<UserData | null>(null);

  public readonly user = computed(() => this.userData());
  public readonly isLoggedIn = computed(() => this.userData() !== null);

  logIn(data: { email: string; password: string }): Observable<UserData> {
    return this.http
      .post<{ access: string; refresh: string; user: UserData }>(
        `${environment.serverUrl}/login/`,
        data
      )
      .pipe(
        take(1),
        tap(async (res) => {
          await Storage.set({ key: 'accessToken', value: res.access });
          await Storage.set({ key: 'refreshToken', value: res.refresh });
          this.userData.set(res.user);
        }),
        map((res) => res.user)
      );
  }

  async logOut(): Promise<void> {
    await Storage.remove({ key: 'accessToken' });
    await Storage.remove({ key: 'refreshToken' });
    this.userData.set(null);
  }

  checkRememberedUser(): void {
  Storage.get({ key: 'accessToken' }).then(({ value: token }) => {
    if (token) {
      this.http
        .get<{ user: UserData; accessToken: string }>(`${environment.serverUrl}/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(take(1))
        .subscribe({
          next: async (res) => {
            this.userData.set(res.user);
            await Storage.set({ key: 'accessToken', value: res.accessToken });
          },
          error: () => this.logOut(),
        });
    }
  });
}
}
