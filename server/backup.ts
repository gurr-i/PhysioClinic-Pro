
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class DatabaseBackup {
  private backupDir: string;

  constructor(customBackupDir?: string) {
    // Use custom backup directory or default to 'backups' folder
    this.backupDir = customBackupDir || path.join(process.cwd(), 'backups');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(filename?: string, customPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = filename || `physiotrack_backup_${timestamp}.sql`;

    // Use custom path if provided, otherwise use default backup directory
    const targetDir = customPath || this.backupDir;
    const backupPath = path.join(targetDir, backupFile);

    // Ensure the directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    try {
      // Use pg_dump with better options for comprehensive backup
      const command = `pg_dump "${databaseUrl}" --verbose --clean --no-acl --no-owner --format=plain --file="${backupPath}"`;
      const { stderr } = await execAsync(command);

      if (stderr && !stderr.includes('NOTICE')) {
        console.warn('pg_dump warnings:', stderr);
      }

      // Verify backup file was created and has content
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      return backupPath;
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async restoreBackup(backupFile: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }

    try {
      // Use psql to restore the backup
      await execAsync(`psql "${databaseUrl}" < "${backupPath}"`);
    } catch (error) {
      throw new Error(`Restore failed: ${error}`);
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files.filter(file => file.endsWith('.sql'));
    } catch (error) {
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    const backupPath = path.join(this.backupDir, filename);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  }

  getBackupPath(filename: string): string {
    return path.join(this.backupDir, filename);
  }

  /**
   * Create a compressed backup using custom format
   */
  async createCompressedBackup(filename?: string, customPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = filename || `physiotrack_backup_${timestamp}.dump`;

    const targetDir = customPath || this.backupDir;
    const backupPath = path.join(targetDir, backupFile);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    try {
      // Use pg_dump with custom format for compression
      const command = `pg_dump "${databaseUrl}" --verbose --clean --no-acl --no-owner --format=custom --compress=9 --file="${backupPath}"`;
      const { stderr } = await execAsync(command);

      if (stderr && !stderr.includes('NOTICE')) {
        console.warn('pg_dump warnings:', stderr);
      }

      if (!fs.existsSync(backupPath)) {
        throw new Error('Compressed backup file was not created');
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Compressed backup file is empty');
      }

      return backupPath;
    } catch (error) {
      throw new Error(`Compressed backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDirectory(): string {
    return this.backupDir;
  }

  /**
   * Set custom backup directory
   */
  setBackupDirectory(newPath: string): void {
    this.backupDir = newPath;
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
}

// Create backup instance with custom directory from environment variable if provided
export const dbBackup = new DatabaseBackup(process.env.BACKUP_DIRECTORY);
