import crypto from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { logInfo, logError, logWarn } from './logger';
import { db, sqlite } from './db-local';
import { cacheManager } from './cache-manager';

interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'schema';
  size: number;
  tables: string[];
  checksum: string;
  version: string;
  compressed: boolean;
}

interface MigrationRecord {
  id: string;
  version: string;
  description: string;
  executed_at: string;
  execution_time: number;
  checksum: string;
}

class BackupManager {
  private backupDir: string;
  private maxBackups: number;
  private compressionEnabled: boolean;

  constructor(options: {
    backupDir?: string;
    maxBackups?: number;
    compressionEnabled?: boolean;
  } = {}) {
    this.backupDir = options.backupDir || './backups';
    this.maxBackups = options.maxBackups || 30;
    this.compressionEnabled = options.compressionEnabled !== false;
    
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logInfo('Backup directory ensured', { path: this.backupDir });
    } catch (error) {
      logError(error as Error, { context: 'Backup directory creation' });
    }
  }

  // Full database backup
  async createFullBackup(): Promise<string | null> {
    try {
      const backupId = `full_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      logInfo('Starting full database backup', { backupId });

      // Get all table data
      const tables = await this.getAllTables();
      const backupData: any = {
        metadata: {
          id: backupId,
          timestamp,
          type: 'full',
          tables: tables.map(t => t.name),
          version: '1.0.0'
        },
        schema: {},
        data: {}
      };

      // Export schema
      for (const table of tables) {
        backupData.schema[table.name] = await this.getTableSchema(table.name);
      }

      // Export data
      for (const table of tables) {
        backupData.data[table.name] = await this.getTableData(table.name);
      }

      // Save backup
      const filename = await this.saveBackup(backupId, backupData, 'full');
      
      // Clean old backups
      await this.cleanOldBackups();
      
      logInfo('Full backup completed', { backupId, filename });
      return filename;
    } catch (error) {
      logError(error as Error, { context: 'Full backup creation' });
      return null;
    }
  }

  // Incremental backup (changes since last backup)
  async createIncrementalBackup(since?: string): Promise<string | null> {
    try {
      const backupId = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const sinceDate = since || await this.getLastBackupTimestamp();

      if (!sinceDate) {
        logWarn('No baseline for incremental backup, creating full backup instead');
        return this.createFullBackup();
      }

      logInfo('Starting incremental backup', { backupId, since: sinceDate });

      const backupData: any = {
        metadata: {
          id: backupId,
          timestamp,
          type: 'incremental',
          since: sinceDate,
          version: '1.0.0'
        },
        changes: {}
      };

      // Get changes for each table
      const tables = await this.getAllTables();
      for (const table of tables) {
        const changes = await this.getTableChanges(table.name, sinceDate);
        if (changes.length > 0) {
          backupData.changes[table.name] = changes;
        }
      }

      const filename = await this.saveBackup(backupId, backupData, 'incremental');
      
      logInfo('Incremental backup completed', { backupId, filename, changesCount: Object.keys(backupData.changes).length });
      return filename;
    } catch (error) {
      logError(error as Error, { context: 'Incremental backup creation' });
      return null;
    }
  }

  // Schema-only backup
  async createSchemaBackup(): Promise<string | null> {
    try {
      const backupId = `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      logInfo('Starting schema backup', { backupId });

      const tables = await this.getAllTables();
      const backupData: any = {
        metadata: {
          id: backupId,
          timestamp,
          type: 'schema',
          tables: tables.map(t => t.name),
          version: '1.0.0'
        },
        schema: {}
      };

      // Export schema only
      for (const table of tables) {
        backupData.schema[table.name] = await this.getTableSchema(table.name);
      }

      const filename = await this.saveBackup(backupId, backupData, 'schema');
      
      logInfo('Schema backup completed', { backupId, filename });
      return filename;
    } catch (error) {
      logError(error as Error, { context: 'Schema backup creation' });
      return null;
    }
  }

  // Restore from backup
  async restoreFromBackup(filename: string, options: {
    tables?: string[];
    dataOnly?: boolean;
    schemaOnly?: boolean;
    dryRun?: boolean;
  } = {}): Promise<boolean> {
    try {
      logInfo('Starting backup restoration', { filename, options });

      const backupData = await this.loadBackup(filename);
      
      if (options.dryRun) {
        logInfo('Dry run - would restore:', {
          type: backupData.metadata.type,
          tables: options.tables || backupData.metadata.tables,
          dataOnly: options.dataOnly,
          schemaOnly: options.schemaOnly
        });
        return true;
      }

      // Create restoration transaction
      const transaction = sqlite.transaction(() => {
        // Restore schema if needed
        if (!options.dataOnly && backupData.schema) {
          this.restoreSchema(backupData.schema, options.tables);
        }

        // Restore data if needed
        if (!options.schemaOnly) {
          if (backupData.data) {
            this.restoreData(backupData.data, options.tables);
          } else if (backupData.changes) {
            this.restoreChanges(backupData.changes, options.tables);
          }
        }
      });

      transaction();

      // Clear cache after restoration
      await cacheManager.clear();

      logInfo('Backup restoration completed', { filename });
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Backup restoration', filename });
      return false;
    }
  }

  // List available backups
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.backup') || file.endsWith('.backup.gz')) {
          try {
            const metadata = await this.getBackupMetadata(file);
            if (metadata) {
              backups.push(metadata);
            }
          } catch (error) {
            logWarn('Failed to read backup metadata', { file, error: error.message });
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      logError(error as Error, { context: 'Listing backups' });
      return [];
    }
  }

  // Delete backup
  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const filepath = join(this.backupDir, filename);
      await fs.unlink(filepath);
      logInfo('Backup deleted', { filename });
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Backup deletion', filename });
      return false;
    }
  }

  // Verify backup integrity
  async verifyBackup(filename: string): Promise<boolean> {
    try {
      const backupData = await this.loadBackup(filename);
      
      // Verify metadata
      if (!backupData.metadata || !backupData.metadata.id) {
        throw new Error('Invalid backup metadata');
      }

      // Verify checksum if available
      if (backupData.metadata.checksum) {
        const currentChecksum = this.calculateChecksum(backupData);
        if (currentChecksum !== backupData.metadata.checksum) {
          throw new Error('Backup checksum mismatch');
        }
      }

      // Verify data structure
      if (backupData.metadata.type === 'full') {
        if (!backupData.schema || !backupData.data) {
          throw new Error('Invalid full backup structure');
        }
      }

      logInfo('Backup verification successful', { filename });
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Backup verification', filename });
      return false;
    }
  }

  // Schedule automatic backups
  private backupInterval?: NodeJS.Timeout;

  startScheduledBackups(options: {
    fullBackupInterval?: number; // hours
    incrementalInterval?: number; // hours
  } = {}): void {
    const fullInterval = (options.fullBackupInterval || 24) * 60 * 60 * 1000;
    const incrementalInterval = (options.incrementalInterval || 6) * 60 * 60 * 1000;

    // Schedule full backups
    setInterval(() => {
      this.createFullBackup().catch(error => {
        logError(error, { context: 'Scheduled full backup' });
      });
    }, fullInterval);

    // Schedule incremental backups
    setInterval(() => {
      this.createIncrementalBackup().catch(error => {
        logError(error, { context: 'Scheduled incremental backup' });
      });
    }, incrementalInterval);

    logInfo('Scheduled backups started', {
      fullInterval: options.fullBackupInterval || 24,
      incrementalInterval: options.incrementalInterval || 6
    });
  }

  stopScheduledBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = undefined;
      logInfo('Scheduled backups stopped');
    }
  }

  // Private helper methods
  private async getAllTables(): Promise<Array<{ name: string }>> {
    const result = sqlite.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as Array<{ name: string }>;
    
    return result;
  }

  private async getTableSchema(tableName: string): Promise<string> {
    const result = sqlite.prepare(`
      SELECT sql FROM sqlite_master
      WHERE type='table' AND name=?
    `).get(tableName) as { sql: string } | undefined;
    
    return result?.sql || '';
  }

  private async getTableData(tableName: string): Promise<any[]> {
    return sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  }

  private async getTableChanges(tableName: string, since: string): Promise<any[]> {
    // For tables with updated_at or created_at columns
    try {
      return sqlite.prepare(`
        SELECT * FROM ${tableName}
        WHERE created_at > ? OR updated_at > ?
      `).all(since, since);
    } catch {
      // Fallback: return all data if no timestamp columns
      return this.getTableData(tableName);
    }
  }

  private async saveBackup(backupId: string, data: any, type: string): Promise<string> {
    const filename = `${backupId}.backup`;
    const filepath = join(this.backupDir, filename);

    // Add checksum to metadata
    data.metadata.checksum = this.calculateChecksum(data);
    data.metadata.size = JSON.stringify(data).length;

    if (this.compressionEnabled) {
      const compressedFilename = `${filename}.gz`;
      const compressedFilepath = join(this.backupDir, compressedFilename);
      
      await pipeline(
        JSON.stringify(data),
        createGzip(),
        createWriteStream(compressedFilepath)
      );
      
      return compressedFilename;
    } else {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      return filename;
    }
  }

  private async loadBackup(filename: string): Promise<any> {
    const filepath = join(this.backupDir, filename);

    if (filename.endsWith('.gz')) {
      const chunks: Buffer[] = [];
      await pipeline(
        createReadStream(filepath),
        createGunzip(),
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk);
          }
        }
      );
      
      const data = Buffer.concat(chunks).toString();
      return JSON.parse(data);
    } else {
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    }
  }

  private async getBackupMetadata(filename: string): Promise<BackupMetadata | null> {
    try {
      const backupData = await this.loadBackup(filename);
      return backupData.metadata;
    } catch {
      return null;
    }
  }

  private async getLastBackupTimestamp(): Promise<string | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0].timestamp : null;
  }

  private calculateChecksum(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private restoreSchema(schema: any, tables?: string[]): void {
    for (const [tableName, sql] of Object.entries(schema)) {
      if (tables && !tables.includes(tableName)) continue;
      
      // Drop existing table
      sqlite.prepare(`DROP TABLE IF EXISTS ${tableName}`).run();
      
      // Recreate table
      sqlite.prepare(sql as string).run();
    }
  }

  private restoreData(data: any, tables?: string[]): void {
    for (const [tableName, rows] of Object.entries(data) as [string, any[]][]) {
      if (tables && !tables.includes(tableName)) continue;
      
      // Clear existing data
      sqlite.prepare(`DELETE FROM ${tableName}`).run();
      
      // Insert data
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const stmt = sqlite.prepare(`INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`);
        
        for (const row of rows) {
          stmt.run(...columns.map(col => row[col]));
        }
      }
    }
  }

  private restoreChanges(changes: any, tables?: string[]): void {
    // This would implement incremental restoration logic
    // For now, treat as full data restoration
    this.restoreData(changes, tables);
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.id + '.backup');
        }
        
        logInfo('Old backups cleaned', { deleted: toDelete.length });
      }
    } catch (error) {
      logError(error as Error, { context: 'Backup cleanup' });
    }
  }
}

// Migration Manager
class MigrationManager {
  private migrations: Map<string, Migration> = new Map();

  constructor() {
    this.ensureMigrationTable();
  }

  private ensureMigrationTable(): void {
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        description TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        execution_time INTEGER NOT NULL,
        checksum TEXT NOT NULL
      )
    `).run();
  }

  addMigration(migration: Migration): void {
    this.migrations.set(migration.id, migration);
  }

  async runMigrations(): Promise<boolean> {
    try {
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logInfo('No pending migrations');
        return true;
      }

      logInfo('Running migrations', { count: pendingMigrations.length });

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      logInfo('All migrations completed');
      return true;
    } catch (error) {
      logError(error as Error, { context: 'Migration execution' });
      return false;
    }
  }

  private async getPendingMigrations(): Promise<Migration[]> {
    const executedMigrations = sqlite.prepare('SELECT id FROM migrations').all() as Array<{ id: string }>;
    const executedIds = new Set(executedMigrations.map(m => m.id));

    return Array.from(this.migrations.values())
      .filter(m => !executedIds.has(m.id))
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  private async runMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    try {
      logInfo('Running migration', { id: migration.id, description: migration.description });

      // Run migration in transaction
      const transaction = sqlite.transaction(() => {
        migration.up();
        
        // Record migration
        sqlite.prepare(`
          INSERT INTO migrations (id, version, description, executed_at, execution_time, checksum)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          migration.id,
          migration.version,
          migration.description,
          new Date().toISOString(),
          Date.now() - startTime,
          this.calculateMigrationChecksum(migration)
        );
      });

      transaction();

      logInfo('Migration completed', { 
        id: migration.id, 
        executionTime: Date.now() - startTime 
      });
    } catch (error) {
      logError(error as Error, { 
        context: 'Migration execution', 
        migrationId: migration.id 
      });
      throw error;
    }
  }

  private calculateMigrationChecksum(migration: Migration): string {
    return crypto.createHash('sha256')
      .update(migration.up.toString() + migration.down.toString())
      .digest('hex');
  }
}

// Migration interface
interface Migration {
  id: string;
  version: string;
  description: string;
  up: () => void;
  down: () => void;
}

// Global instances
export const backupManager = new BackupManager({
  backupDir: './backups',
  maxBackups: 50,
  compressionEnabled: true
});

export const migrationManager = new MigrationManager();

// Example migrations
migrationManager.addMigration({
  id: '001_initial_schema',
  version: '1.0.0',
  description: 'Initial database schema',
  up: () => {
    // This would be handled by initializeDatabase
  },
  down: () => {
    // Drop all tables
  }
});

migrationManager.addMigration({
  id: '002_add_user_sessions',
  version: '1.0.1',
  description: 'Add user sessions table',
  up: () => {
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();
  },
  down: () => {
    sqlite.prepare('DROP TABLE IF EXISTS user_sessions').run();
  }
});

// Utility functions
export async function createBackupNow(type: 'full' | 'incremental' | 'schema' = 'full'): Promise<string | null> {
  switch (type) {
    case 'full':
      return backupManager.createFullBackup();
    case 'incremental':
      return backupManager.createIncrementalBackup();
    case 'schema':
      return backupManager.createSchemaBackup();
    default:
      return null;
  }
}

export async function restoreFromBackupNow(filename: string, options: any = {}): Promise<boolean> {
  return backupManager.restoreFromBackup(filename, options);
}

export async function runMigrationsNow(): Promise<boolean> {
  return migrationManager.runMigrations();
}

export default { backupManager, migrationManager };