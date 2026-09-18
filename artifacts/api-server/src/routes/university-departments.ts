export const universityDepartment = pgTable("university_department", {
  id: uuid("id").primaryKey(),
  universityName: text("university_name").notNull(),
  department: text("department").notNull(),
  expertise: text("expertise"),
  district: text("district"),
});
