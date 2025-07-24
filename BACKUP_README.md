# PhysioTrack Database Backup System

This document explains how to use the automated database backup system integrated into your PhysioTrack application.

## Features

- ✅ **Automatic backup on server startup**
- ✅ **Custom backup locations**
- ✅ **Multiple backup formats** (SQL and compressed)
- ✅ **Automatic cleanup** of old backups
- ✅ **Command-line utility** for manual operations
- ✅ **Environment-based configuration**

## Quick Start

### 1. Automatic Backup on Startup

By default, the application will create a database backup every time the server starts. No additional configuration is needed!

```bash
npm run dev    # Creates backup automatically
npm start      # Creates backup automatically
```

### 2. Manual Backup Commands

```bash
# Create a simple SQL backup
npm run db:backup

# Create a compressed backup (smaller file size)
npm run db:backup:compressed

# List all available backups
npm run db:backup:list
```

### 3. Advanced Backup Utility

Use the comprehensive backup utility for more options:

```bash
# Show help
npm run backup:utility help

# Create backup with custom name
npm run backup:utility create my_backup.sql

# Create backup in custom location
npm run backup:utility create my_backup.sql /path/to/custom/location

# List all backups with details
npm run backup:utility list

# Restore from backup
npm run backup:utility restore my_backup.sql

# Delete a backup
npm run backup:utility delete old_backup.sql

# Clean up old backups
npm run backup:utility cleanup

# Show current configuration
npm run backup:utility config
```

## Configuration

Configure backup behavior using environment variables in your `.env` file:

```env
# Enable/disable backup functionality (default: true)
BACKUP_ENABLED=true

# Enable/disable backup on server startup (default: true)
BACKUP_ON_STARTUP=true

# Custom backup directory (optional, defaults to ./backups)
BACKUP_DIRECTORY=/path/to/your/backup/location

# Backup format: 'sql' for plain SQL or 'compressed' for custom format (default: sql)
BACKUP_FORMAT=sql

# Number of days to retain backups (default: 7, set to 0 to disable cleanup)
BACKUP_RETENTION_DAYS=7
```

## Backup Formats

### SQL Format (Default)
- **File extension**: `.sql`
- **Pros**: Human-readable, can be edited, works with any PostgreSQL client
- **Cons**: Larger file size
- **Use case**: Development, debugging, manual inspection

### Compressed Format
- **File extension**: `.dump`
- **Pros**: Much smaller file size, faster backup/restore
- **Cons**: Binary format, requires `pg_restore` to restore
- **Use case**: Production, automated backups, storage efficiency

## Backup Locations

### Default Location
Backups are stored in the `./backups` directory by default.

### Custom Location
Set the `BACKUP_DIRECTORY` environment variable to use a custom location:

```env
BACKUP_DIRECTORY=/home/user/database-backups
```

Or specify a custom path when creating backups:

```bash
npm run backup:utility create backup.sql /custom/path
```

## Automatic Cleanup

The system can automatically delete old backups based on the retention policy:

- Set `BACKUP_RETENTION_DAYS` to the number of days to keep backups
- Set to `0` to disable automatic cleanup
- Cleanup runs after each startup backup
- Manual cleanup: `npm run backup:utility cleanup`

## Restore Process

### From SQL Backup
```bash
npm run backup:utility restore my_backup.sql
```

### From Compressed Backup
For compressed backups, you'll need to use `pg_restore` directly:

```bash
pg_restore -d "your_database_url" /path/to/backup.dump
```

## Troubleshooting

### Common Issues

1. **"pg_dump command not found"**
   - Install PostgreSQL client tools
   - Ensure `pg_dump` is in your system PATH

2. **"Permission denied"**
   - Check file permissions on backup directory
   - Ensure database user has necessary privileges

3. **"Backup file is empty"**
   - Check database connection
   - Verify DATABASE_URL is correct
   - Check PostgreSQL server is running

### Logs

The application logs backup operations. Check your server logs for:
- `Database backup created successfully: /path/to/backup`
- `Startup backup process failed: error_message`

## Security Considerations

- **Backup files contain sensitive data** - store them securely
- **Restrict access** to backup directories
- **Consider encryption** for backups stored off-site
- **Regular testing** - verify backups can be restored

## Best Practices

1. **Test your backups regularly** by restoring to a test database
2. **Store backups off-site** for disaster recovery
3. **Monitor backup sizes** to detect issues early
4. **Use compressed format** for production to save space
5. **Set appropriate retention policies** to manage disk usage

## Integration with CI/CD

You can integrate backup creation into your deployment pipeline:

```bash
# In your deployment script
npm run backup:utility create pre_deploy_backup.sql
# ... deploy your application ...
# Backup is automatically created on startup
```
