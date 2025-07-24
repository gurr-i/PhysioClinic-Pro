import { dbBackup } from './backup';
import { log } from './vite';
import fs from 'fs';

export interface BackupConfig {
  enabled: boolean;
  onStartup: boolean;
  customPath?: string;
  format: 'sql' | 'compressed';
  retentionDays?: number;
}

export class BackupManager {
  private config: BackupConfig;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      enabled: true,
      onStartup: true,
      format: 'sql',
      retentionDays: 7,
      ...config
    };
  }

  async performStartupBackup(): Promise<void> {
    if (!this.config.enabled || !this.config.onStartup) {
      log('Startup backup is disabled');
      return;
    }

    try {
      let backupPath: string;
      
      if (this.config.format === 'compressed') {
        backupPath = await dbBackup.createCompressedBackup(undefined, this.config.customPath);
        log(`Compressed database backup created: ${backupPath}`);
      } else {
        backupPath = await dbBackup.createBackup(undefined, this.config.customPath);
        log(`Database backup created: ${backupPath}`);
      }

      // Clean up old backups if retention is set
      if (this.config.retentionDays) {
        await this.cleanupOldBackups();
      }

    } catch (error) {
      log(`Startup backup failed: ${error}`);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    if (!this.config.retentionDays) return;

    try {
      const backups = await dbBackup.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const backup of backups) {
        const backupPath = dbBackup.getBackupPath(backup);
        const stats = fs.statSync(backupPath);

        if (stats.mtime < cutoffDate) {
          await dbBackup.deleteBackup(backup);
          log(`Deleted old backup: ${backup}`);
        }
      }
    } catch (error) {
      log(`Backup cleanup failed: ${error}`);
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default backup manager instance
export const backupManager = new BackupManager({
  enabled: process.env.BACKUP_ENABLED !== 'false',
  onStartup: process.env.BACKUP_ON_STARTUP !== 'false',
  customPath: process.env.BACKUP_DIRECTORY,
  format: (process.env.BACKUP_FORMAT as 'sql' | 'compressed') || 'sql',
  retentionDays: process.env.BACKUP_RETENTION_DAYS ? parseInt(process.env.BACKUP_RETENTION_DAYS) : 7
});
