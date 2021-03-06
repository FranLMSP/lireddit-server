import { Migration } from '@mikro-orm/migrations';

export class Migration20201019154643 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" drop constraint if exists "user_password_check";');
    this.addSql('alter table "user" alter column "password" type text using ("password"::text);');
  }

}
