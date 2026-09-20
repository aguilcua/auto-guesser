import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  pgEnum,
  primaryKey,
  jsonb, text,
} from "drizzle-orm/pg-core";
export const categoryEnum = pgEnum("category", [
  "drivetrain",
  "engine",
  "body_style",
  "origin",
  "design",
  "pop_culture","character",
]);

export const cars = pgTable("cars", {
  id: uuid("id").defaultRandom().primaryKey(),
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  imageUrl: varchar("image_url", { length: 1024 }),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  chassisCode: varchar("chassis_code", { length: 20 }),
  baseWeight: integer("base_weight").notNull().default(1),
  //analytic stuff
  guessCount: integer("guess_count").default(0).notNull(),
  stumpCount: integer("stump_count").default(0).notNull(),
});

export const attributes = pgTable("attributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionText: varchar("question_text", { length: 255 }).notNull(),
  category: categoryEnum("category").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  //analytics stuff
  askCount: integer("ask_count").default(0).notNull(),
  idkCount: integer("idk_count").default(0).notNull(),
});

export const carAttributes = pgTable(
  "car_attributes",
  {
    carId: uuid("car_id")
      .references(() => cars.id)
      .notNull(),
    attributeId: uuid("attribute_id")
      .references(() => attributes.id)
      .notNull(),
    isMatch: boolean("is_match").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.carId, t.attributeId] }),
  }),
);

export const globalStats = pgTable("global_stats", {
  id: integer("id").primaryKey().default(1),
  totalGamesPlayed: integer("total_games").default(0).notNull(),
  //json object mapping question count to frequency
  gameLengthDistribution: jsonb("game_length_distribution")
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
});

//table to keep track of votes for new questions
export const pendingVotes = pgTable(
  "pending_votes",
  {
    carId: uuid("car_id").references(() => cars.id).notNull(), // Change to uuid() if your cars.id is a UUID
    attributeId: uuid("attribute_id").references(() => attributes.id).notNull(),
    yesVotes: integer("yes_votes").default(0).notNull(),
    noVotes: integer("no_votes").default(0).notNull(),
  },
  (table) => ({
    // This ensures we only ever have one tally row per car/question combo
    pk: primaryKey({ columns: [table.carId, table.attributeId] }), 
  })
);
