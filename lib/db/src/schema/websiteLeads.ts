import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const websiteLeadsTable = pgTable("website_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email"),
  phone: text("phone"),
  niche: text("niche").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertWebsiteLeadSchema = createInsertSchema(
  websiteLeadsTable,
).omit({ id: true, createdAt: true });

export type InsertWebsiteLead = z.infer<typeof insertWebsiteLeadSchema>;
export type WebsiteLead = typeof websiteLeadsTable.$inferSelect;
