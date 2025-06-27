#!/bin/bash
# PostgreSQL Backup Script for MenuIQ

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
DB_NAME="menuiq_production"
DB_USER="menuiq"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Database backup using pg_dump
export PGPASSWORD="Mahmoud.10"
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/menuiq_postgres_$DATE.sql.gz

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /root/menuiq/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "menuiq_postgres_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed at $(date)"
echo "Backup files:"
ls -lh $BACKUP_DIR/menuiq_postgres_$DATE.sql.gz
ls -lh $BACKUP_DIR/uploads_$DATE.tar.gz