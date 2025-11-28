import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1732793000000 implements MigrationInterface {
  name = "InitialSchema1732793000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL,
        "supabase_id" character varying(255),
        "email" character varying(255),
        "name" character varying(100),
        "role" character varying(20) NOT NULL DEFAULT 'user',
        "subscription_tier" character varying(20) NOT NULL DEFAULT 'free',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_supabase_id" UNIQUE ("supabase_id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create pvs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pvs" (
        "id" character varying(50) NOT NULL,
        "title" character varying(255) NOT NULL,
        "framework" character varying(50) NOT NULL,
        "has_notification" boolean NOT NULL DEFAULT false,
        "has_deroulement" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_pvs" PRIMARY KEY ("id")
      )
    `);

    // Create pv_sections table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pv_sections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pv_id" character varying(50) NOT NULL,
        "label" character varying(50) NOT NULL,
        "title" character varying(255) NOT NULL,
        "order" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_pv_sections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pv_sections_pv" FOREIGN KEY ("pv_id") REFERENCES "pvs"("id") ON DELETE CASCADE
      )
    `);

    // Create blocks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blocks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "section_id" uuid NOT NULL,
        "type" character varying(20) NOT NULL,
        "order" integer NOT NULL DEFAULT 1,
        "label" character varying(100),
        "content" text NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "explanation" text,
        CONSTRAINT "PK_blocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blocks_section" FOREIGN KEY ("section_id") REFERENCES "pv_sections"("id") ON DELETE CASCADE
      )
    `);

    // Create pv_contents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pv_contents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pv_id" character varying(50) NOT NULL,
        "label" character varying(50) NOT NULL,
        "framework" character varying(50),
        "content" text NOT NULL,
        CONSTRAINT "PK_pv_contents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pv_contents_pv" FOREIGN KEY ("pv_id") REFERENCES "pvs"("id") ON DELETE CASCADE
      )
    `);

    // Create investigation_frameworks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investigation_frameworks" (
        "id" character varying(50) NOT NULL,
        "cadre_legal" text NOT NULL,
        "justification" text NOT NULL,
        "competence" text NOT NULL,
        CONSTRAINT "PK_investigation_frameworks" PRIMARY KEY ("id")
      )
    `);

    // Create attempts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attempts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "block_id" uuid NOT NULL,
        "is_correct" boolean NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attempts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attempts_block" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE
      )
    `);

    // Create exam_sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "pv_id" character varying(50) NOT NULL,
        "total_questions" integer NOT NULL DEFAULT 0,
        "correct_answers" integer NOT NULL DEFAULT 0,
        "score" integer NOT NULL DEFAULT 0,
        "completed" boolean NOT NULL DEFAULT false,
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_exam_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exam_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_sessions_pv" FOREIGN KEY ("pv_id") REFERENCES "pvs"("id") ON DELETE CASCADE
      )
    `);

    // Create user_block_stats table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_block_stats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "block_id" uuid NOT NULL,
        "attempts_count" integer NOT NULL DEFAULT 0,
        "correct_count" integer NOT NULL DEFAULT 0,
        "last_attempt_at" TIMESTAMP,
        CONSTRAINT "PK_user_block_stats" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_block_stats" UNIQUE ("user_id", "block_id"),
        CONSTRAINT "FK_user_block_stats_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_block_stats_block" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE
      )
    `);

    // Create promo_codes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promo_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(50) NOT NULL,
        "type" character varying(20) NOT NULL DEFAULT 'beta',
        "description" character varying(200),
        "duration_days" integer NOT NULL,
        "max_uses" integer,
        "used_count" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promo_codes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_promo_codes_code" UNIQUE ("code")
      )
    `);

    // Create user_promo_redemptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_promo_redemptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "promo_code_id" uuid NOT NULL,
        "redeemed_at" TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_user_promo_redemptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_promo_redemptions" UNIQUE ("user_id", "promo_code_id"),
        CONSTRAINT "FK_user_promo_redemptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_promo_redemptions_promo" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE
      )
    `);

    // Create tickets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" character varying(20) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'open',
        "severity" character varying(20) NOT NULL DEFAULT 'medium',
        "subject" character varying(255),
        "message" text NOT NULL,
        "pvId" character varying(255),
        "contextUrl" character varying(500),
        "contactEmail" character varying(255),
        "reporterName" character varying(100),
        "userId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create anonymous_access table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "anonymous_access" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ip_address" character varying(45) NOT NULL,
        "fingerprint" character varying(64),
        "pv_id" character varying(50) NOT NULL,
        "first_accessed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_anonymous_access" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_anonymous_access" UNIQUE ("ip_address", "pv_id"),
        CONSTRAINT "FK_anonymous_access_pv" FOREIGN KEY ("pv_id") REFERENCES "pvs"("id") ON DELETE CASCADE
      )
    `);

    // Create index on anonymous_access
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_anonymous_access_ip" ON "anonymous_access" ("ip_address")
    `);

    // Create user_pv_access table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_pv_access" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "pv_id" character varying(50) NOT NULL,
        "first_accessed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_pv_access" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_pv_access" UNIQUE ("user_id", "pv_id"),
        CONSTRAINT "FK_user_pv_access_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_pv_access_pv" FOREIGN KEY ("pv_id") REFERENCES "pvs"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_pv_access"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "anonymous_access"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_promo_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_codes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_block_stats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "investigation_frameworks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pv_contents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pv_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pvs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
