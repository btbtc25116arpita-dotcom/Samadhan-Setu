// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const problems = pgTable("problems", {
  id: text("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  category: text("category"),
  district: text("district"),
  location: text("location"),
  urgency: text("urgency"),
  people: text("people"),
  evidence: text("evidence"),
  status: text("status"),
  votes: integer("votes").default(0),
  reportedBy: text("reported_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull(),
  district: text("district"),

  passwordHash: text("password_hash"),
  organizationName: text("organization_name"),
  verified: boolean("verified").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
