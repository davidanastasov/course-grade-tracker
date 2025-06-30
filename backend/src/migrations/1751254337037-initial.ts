import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1751254337037 implements MigrationInterface {
    name = 'Initial1751254337037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."grade_components_type_enum" AS ENUM('Lab', 'Assignment', 'Midterm', 'Exam', 'Project')`);
        await queryRunner.query(`CREATE TABLE "grade_components" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" "public"."grade_components_type_enum" NOT NULL, "weight" numeric(5,2) NOT NULL, "minimumScore" numeric(5,2) NOT NULL DEFAULT '0', "totalPoints" numeric(8,2) NOT NULL DEFAULT '100', "isMandatory" boolean NOT NULL DEFAULT false, "courseId" uuid, CONSTRAINT "PK_976138902c8bcede7e4fe4ec3c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "grade_bands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "minScore" numeric(5,2) NOT NULL, "maxScore" numeric(5,2) NOT NULL, "gradeValue" integer NOT NULL, "courseId" uuid, CONSTRAINT "PK_d8e880f332ab4896f93185d743e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "grades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric(5,2) NOT NULL, "maxScore" numeric(5,2), "feedback" text, "isSubmitted" boolean NOT NULL DEFAULT false, "isGraded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "studentId" uuid, "assignmentId" uuid, "courseId" uuid, CONSTRAINT "PK_4740fb6f5df2505a48649f1687b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "fileName" character varying NOT NULL, "filePath" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), "assignmentId" uuid, CONSTRAINT "PK_96f7fab55e3a114cc7a66e1c929" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignments_type_enum" AS ENUM('lab', 'assignment', 'quiz', 'exam', 'project')`);
        await queryRunner.query(`CREATE TYPE "public"."assignments_status_enum" AS ENUM('draft', 'published', 'completed', 'graded')`);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "type" "public"."assignments_type_enum" NOT NULL, "maxScore" numeric(5,2) NOT NULL, "weight" numeric(5,2) NOT NULL DEFAULT '0', "dueDate" TIMESTAMP, "status" "public"."assignments_status_enum" NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "courseId" uuid, "createdById" uuid, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "credits" integer NOT NULL DEFAULT '3', "passingGrade" numeric(5,2) NOT NULL DEFAULT '50', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "professorId" uuid, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."enrollments_status_enum" AS ENUM('active', 'completed', 'dropped')`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."enrollments_status_enum" NOT NULL DEFAULT 'active', "enrolledAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "studentId" uuid, "courseId" uuid, CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'professor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "grade_components" ADD CONSTRAINT "FK_ecb5a6d52275af6d351a5b9c848" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "grade_bands" ADD CONSTRAINT "FK_9e1a66ba28f90d08c9323b36de4" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "grades" ADD CONSTRAINT "FK_fcfc027e4e5fb37a4372e688070" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "grades" ADD CONSTRAINT "FK_9a4ec29a3b29310f9fe8999bf3f" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "grades" ADD CONSTRAINT "FK_ff09424ef05361e1c47fa03d82b" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_files" ADD CONSTRAINT "FK_8e43e4bb0773b8ee70008086f04" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_9e5684667ea189ade0fc79fa4f1" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_d70609c9c9d978514fefe5999ac" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_d59c338c33d1a7b65228f31e6c7" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_60dd0ae4e21002e63a5fdefeec8" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_60dd0ae4e21002e63a5fdefeec8"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_d59c338c33d1a7b65228f31e6c7"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_d70609c9c9d978514fefe5999ac"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_9e5684667ea189ade0fc79fa4f1"`);
        await queryRunner.query(`ALTER TABLE "assignment_files" DROP CONSTRAINT "FK_8e43e4bb0773b8ee70008086f04"`);
        await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_ff09424ef05361e1c47fa03d82b"`);
        await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_9a4ec29a3b29310f9fe8999bf3f"`);
        await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_fcfc027e4e5fb37a4372e688070"`);
        await queryRunner.query(`ALTER TABLE "grade_bands" DROP CONSTRAINT "FK_9e1a66ba28f90d08c9323b36de4"`);
        await queryRunner.query(`ALTER TABLE "grade_components" DROP CONSTRAINT "FK_ecb5a6d52275af6d351a5b9c848"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TYPE "public"."assignments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignments_type_enum"`);
        await queryRunner.query(`DROP TABLE "assignment_files"`);
        await queryRunner.query(`DROP TABLE "grades"`);
        await queryRunner.query(`DROP TABLE "grade_bands"`);
        await queryRunner.query(`DROP TABLE "grade_components"`);
        await queryRunner.query(`DROP TYPE "public"."grade_components_type_enum"`);
    }

}
