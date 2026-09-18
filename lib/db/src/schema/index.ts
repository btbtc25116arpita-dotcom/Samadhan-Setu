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

import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
  validatedBy: text("validated_by"),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  validationStatus: text("validation_status").default("pending"),
  validationNote: text("validation_note"),
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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  problemId: text("problem_id").notNull(),
  projectName: text("project_name").notNull(),
  description: text("description"),
  universityId: uuid("university_id"),
  status: text("status").notNull().default("Proposed"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id"),
  teamName: text("team_name").notNull(),
  universityName: text("university_name"),
  department: text("department"),
  teamLead: text("team_lead"),
  membersCount: integer("members_count").default(0),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const industryPartners = pgTable("industry_partners", {
  id: uuid("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industryType: text("industry_type"),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  expertise: text("expertise"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const supportOffers = pgTable("support_offers", {
  id: uuid("id").primaryKey(),
  industryPartnerId: uuid("industry_partner_id"),
  projectId: uuid("project_id"),
  supportType: text("support_type"),
  description: text("description"),
  fundingAmount: numeric("funding_amount"),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const districtAnalytics = pgTable("district_analytics", {
  id: uuid("id").primaryKey(),
  district: text("district").notNull(),
  totalProblems: integer("total_problems").default(0),
  resolvedProblems: integer("resolved_problems").default(0),
  pendingProblems: integer("pending_problems").default(0),
  activeProjects: integer("active_projects").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const universityDepartment = pgTable("university_department", {
  id: uuid("id").primaryKey(),
  universityName: text("university_name").notNull(),
  department: text("department").notNull(),
  expertise: text("expertise"),
  district: text("district"),
});
export const aiAnalysis = pgTable("ai_analysis", {
  id: uuid("id").primaryKey(),
  problemId: text("problem_id").notNull(),
  predictedCategory: text("predicted_category"),
  requiredExpertise: text("required_expertise"),
  predictedPriority: text("predicted_priority"),
  matchedUniversity: text("matched_university"),
  matchedDepartment: text("matched_department"),
  confidence: numeric("confidence"),
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
