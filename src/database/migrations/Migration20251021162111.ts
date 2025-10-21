import { Migration } from '@mikro-orm/migrations';

export class Migration20251021162111 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`test\` (\`id\` text not null, \`name\` text not null, \`created_at\` datetime not null default CURRENT_TIMESTAMP, \`updated_at\` datetime not null default CURRENT_TIMESTAMP, primary key (\`id\`));`);
  }

}
