import { computed, inject, Injectable, signal } from '@angular/core';
import { UserData } from '../models/user-data.interface';
import { firstValueFrom, map, Observable, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.test';
import { Storage } from '@capacitor/storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userData = signal<UserData | null>(null);

  public readonly user = computed(() => this.userData());
  public readonly isLoggedIn = computed(() => this.userData() !== null);
  // public readonly showLoginReminder = computed(() => this.userData());

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
          await Storage.set({
            key: 'cachedUser',
            value: JSON.stringify(res.user),
          });
          this.userData.set(res.user);
        }),
        map((res) => res.user)
      );
  }

  signUp(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<UserData> {
    return this.http
      .post<{ access: string; refresh: string; user: UserData }>(
        `${environment.serverUrl}/signup/`,
        data
      )
      .pipe(
        take(1),
        tap(async (res) => {
          await Storage.set({ key: 'accessToken', value: res.access });
          await Storage.set({ key: 'refreshToken', value: res.refresh });
          await Storage.set({
            key: 'cachedUser',
            value: JSON.stringify(res.user),
          });
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

  private async handleTokenRefresh(): Promise<void> {
    const refreshToken = await Storage.get({ key: 'refreshToken' });

    if (!refreshToken) {
      this.logOut();
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<{ access: string }>(
          `${environment.serverUrl}/token/refresh/`,
          { refresh: refreshToken.value }
        )
      );

      if (response?.access) {
        await Storage.set({ key: 'accessToken', value: response.access });
      }
    } catch (error) {
      // If refresh token is invalid or expired, log out the user
      console.error('[AuthService] Token refresh failed:', error);
      await this.logOut();
    }
  }

  checkRememberedUser(): void {
    Storage.get({ key: 'accessToken' }).then(({ value: token }) => {
      if (token) {
        this.http
          .get<{ user: UserData; access: string }>(
            `${environment.serverUrl}/me/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .pipe(take(1))
          .subscribe({
            next: async (res) => {
              this.userData.set(res.user);
              await Storage.set({ key: 'accessToken', value: res.access });
            },
            error: async (err) => {
              if (err.status === 401) {
                await this.handleTokenRefresh();

                const newToken = await Storage.get({ key: 'accessToken' });
                if (newToken) {
                  this.http
                    .get<{ user: UserData; access: string }>(
                      `${environment.serverUrl}/me/`,
                      {
                        headers: { Authorization: `Bearer ${newToken.value}` },
                      }
                    )
                    .pipe(take(1))
                    .subscribe({
                      next: async (res) => {
                        this.userData.set(res.user);
                        await Storage.set({
                          key: 'accessToken',
                          value: res.access,
                        });
                      },
                      error: () => {
                        console.error(
                          '[AuthService] Token refresh retry failed'
                        );
                        this.logOut();
                      },
                    });
                } else this.logOut();
              } else if (err.status === 0) {
                //No internet connection
                console.warn('[AuthService] Offline, keeping cached user');
                const storedUser = await Storage.get({ key: 'cachedUser' });
                if (storedUser.value) {
                  this.userData.set(JSON.parse(storedUser.value));
                }
              }
            },
          });
      }
    });
  }
}
