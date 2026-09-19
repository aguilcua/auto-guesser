DO $$ BEGIN
 CREATE TYPE "public"."category" AS ENUM('drivetrain', 'engine', 'body_style', 'origin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_text" varchar(255) NOT NULL,
	"category" "category" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "car_attributes" (
	"car_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"is_match" boolean NOT NULL,
	CONSTRAINT "car_attributes_car_id_attribute_id_pk" PRIMARY KEY("car_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" varchar(50) NOT NULL,
	"model" varchar(50) NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer,
	"chassis_code" varchar(20),
	"base_weight" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "car_attributes" ADD CONSTRAINT "car_attributes_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "car_attributes" ADD CONSTRAINT "car_attributes_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
