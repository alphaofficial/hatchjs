import { Migration } from '@mikro-orm/migrations';

/**
 * Rebuild the sessions table for split-token authentication.
 *
 * Token format: `<id>.<secret>`. The DB row is keyed by the plaintext id,
 * stores the SHA-256 hash of the secret, and records the original creation
 * time for audit. A DB leak alone cannot reconstruct live session tokens.
 *
 * All existing sessions are invalidated — users must sign in again.
 */
export class Migration20260420000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql('drop index if exists `sessions_user_id_index`;');
    this.addSql('drop index if exists `sessions_last_activity_index`;');
    this.addSql('drop table if exists `sessions`;');
    this.addSql(
      'create table `sessions` (' +
        '`id` text not null, ' +
        '`secret_hash` text not null, ' +
        '`user_id` text null, ' +
        '`ip_address` text null, ' +
        '`user_agent` text null, ' +
        '`payload` text not null, ' +
        '`last_activity` integer not null, ' +
        '`created_at` integer not null, ' +
        'primary key (`id`)' +
      ');'
    );
    this.addSql('create index `sessions_user_id_index` on `sessions` (`user_id`);');
    this.addSql('create index `sessions_last_activity_index` on `sessions` (`last_activity`);');
  }

  override async down(): Promise<void> {
    this.addSql('drop index if exists `sessions_user_id_index`;');
    this.addSql('drop index if exists `sessions_last_activity_index`;');
    this.addSql('drop table if exists `sessions`;');
    this.addSql(
      'create table `sessions` (' +
        '`id` text not null, ' +
        '`user_id` text null, ' +
        '`ip_address` text null, ' +
        '`user_agent` text null, ' +
        '`payload` text not null, ' +
        '`last_activity` integer not null, ' +
        'primary key (`id`)' +
      ');'
    );
    this.addSql('create index `sessions_user_id_index` on `sessions` (`user_id`);');
    this.addSql('create index `sessions_last_activity_index` on `sessions` (`last_activity`);');
  }
}
