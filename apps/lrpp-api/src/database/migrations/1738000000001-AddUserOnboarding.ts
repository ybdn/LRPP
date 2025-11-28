import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserOnboarding1738000000001 implements MigrationInterface {
  name = "AddUserOnboarding1738000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "study_goal" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "study_goal"
    `);
  }
}
