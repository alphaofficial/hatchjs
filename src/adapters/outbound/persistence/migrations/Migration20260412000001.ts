import { Migration } from '@mikro-orm/migrations';

export class Migration20260412000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`password_resets\` (\`email\` text not null, \`token_hash\` text not null, \`created_at\` datetime not null default CURRENT_TIMESTAMP, primary key (\`email\`));`);
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists `password_resets`;');
  }

}
