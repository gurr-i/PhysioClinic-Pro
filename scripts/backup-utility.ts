#!/usr/bin/env tsx

import '../server/env';
import { dbBackup } from '../server/backup';
import { backupManager } from '../server/backup-config';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const command = args[0];

async function showHelp() {
  console.log(`
PhysioTrack Database Backup Utility

Usage: npm run backup:utility <command> [options]

Commands:
  create [filename] [path]     Create a new SQL backup
  compressed [filename] [path] Create a compressed backup
  list                         List all available backups
  restore <filename>           Restore from a backup file
  delete <filename>            Delete a backup file
  cleanup                      Clean up old backups based on retention policy
  config                       Show current backup configuration
  help                         Show this help message

Examples:
  npm run backup:utility create
  npm run backup:utility create my_backup.sql
  npm run backup:utility create my_backup.sql /custom/path
  npm run backup:utility compressed
  npm run backup:utility list
  npm run backup:utility restore my_backup.sql
  npm run backup:utility delete old_backup.sql
  npm run backup:utility cleanup
  npm run backup:utility config
`);
}

async function createBackup(filename?: string, customPath?: string) {
  try {
    console.log('Creating database backup...');
    const backupPath = await dbBackup.createBackup(filename, customPath);
    console.log(`✅ Backup created successfully: ${backupPath}`);

    const stats = fs.statSync(backupPath);
    console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function createCompressedBackup(filename?: string, customPath?: string) {
  try {
    console.log('Creating compressed database backup...');
    const backupPath = await dbBackup.createCompressedBackup(filename, customPath);
    console.log(`✅ Compressed backup created successfully: ${backupPath}`);

    const stats = fs.statSync(backupPath);
    console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Compressed backup failed:', error);
    process.exit(1);
  }
}

async function listBackups() {
  try {
    const backups = await dbBackup.listBackups();
    if (backups.length === 0) {
      console.log('📁 No backups found');
      return;
    }
    
    console.log(`📁 Found ${backups.length} backup(s):`);
    console.log('');
    
    for (const backup of backups) {
      const backupPath = dbBackup.getBackupPath(backup);
      const stats = fs.statSync(backupPath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      const date = stats.mtime.toLocaleString();
      
      console.log(`  📄 ${backup}`);
      console.log(`     Size: ${size} MB`);
      console.log(`     Created: ${date}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    process.exit(1);
  }
}

async function restoreBackup(filename: string) {
  try {
    console.log(`Restoring database from backup: ${filename}`);
    console.log('⚠️  WARNING: This will overwrite your current database!');
    
    // In a real scenario, you might want to add a confirmation prompt here
    await dbBackup.restoreBackup(filename);
    console.log(`✅ Database restored successfully from: ${filename}`);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

async function deleteBackup(filename: string) {
  try {
    console.log(`Deleting backup: ${filename}`);
    await dbBackup.deleteBackup(filename);
    console.log(`✅ Backup deleted successfully: ${filename}`);
  } catch (error) {
    console.error('❌ Delete failed:', error);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  try {
    console.log('Cleaning up old backups...');
    await backupManager.cleanupOldBackups();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

async function showConfig() {
  const config = backupManager.getConfig();
  console.log('🔧 Current Backup Configuration:');
  console.log('');
  console.log(`  Enabled: ${config.enabled}`);
  console.log(`  Backup on startup: ${config.onStartup}`);
  console.log(`  Format: ${config.format}`);
  console.log(`  Retention days: ${config.retentionDays || 'No limit'}`);
  console.log(`  Custom path: ${config.customPath || 'Default (./backups)'}`);
  console.log(`  Backup directory: ${dbBackup.getBackupDirectory()}`);
}

async function main() {
  switch (command) {
    case 'create':
      await createBackup(args[1], args[2]);
      break;
    case 'compressed':
      await createCompressedBackup(args[1], args[2]);
      break;
    case 'list':
      await listBackups();
      break;
    case 'restore':
      if (!args[1]) {
        console.error('❌ Please specify a backup filename to restore');
        process.exit(1);
      }
      await restoreBackup(args[1]);
      break;
    case 'delete':
      if (!args[1]) {
        console.error('❌ Please specify a backup filename to delete');
        process.exit(1);
      }
      await deleteBackup(args[1]);
      break;
    case 'cleanup':
      await cleanupOldBackups();
      break;
    case 'config':
      await showConfig();
      break;
    case 'help':
    default:
      await showHelp();
      break;
  }
}

main().catch(console.error);
