import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment.test';
import { take } from 'rxjs';
import { BackupData } from '../models/backup-data.interface';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class RemoteDatabaseService {
  private backupStatus = signal<BackupData | null>(null);
  private http = inject(HttpClient);
  private db = inject(DatabaseService);

  async upload(): Promise<void> {
    const db = this.db.getDatabase();
    const exportResult = await db.exportToJson('full'); // or CapacitorSQLite.exportToJson()
    const base64: String = btoa(JSON.stringify(exportResult));

    this.http
      .post<{ success: boolean; message: string; last_sync: string }>(
        `${environment.serverUrl}/backup/upload/`,
        { sqlite_blob: base64 }
      )
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Upload successful');
          this.backupStatus.set({
            last_sync: new Date(res.last_sync),
            status: res.success,
          });
        },
        error: (err) => {
          console.error('Upload failed ' + err);
          this.backupStatus.update((prev) => ({
            last_sync: undefined,
            status: false,
          }));
        },
      });
  }
}
