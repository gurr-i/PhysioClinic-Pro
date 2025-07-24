import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  medicalHistory: text("medical_history"),
  emergencyContact: text("emergency_contact"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  visitDate: timestamp("visit_date").notNull(),
  treatmentProvided: text("treatment_provided").notNull(),
  duration: integer("duration").notNull(), // in minutes
  notes: text("notes"),
  charges: decimal("charges", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  visitId: integer("visit_id").references(() => visits.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // 'payment', 'advance'
  paymentMethod: text("payment_method").notNull(), // 'cash', 'card', 'transfer'
  paymentDate: timestamp("payment_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'equipment', 'supplies'
  currentStock: integer("current_stock").notNull(),
  minStockLevel: integer("min_stock_level").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  description: text("description"),
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventoryUsage = pgTable("inventory_usage", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id, { onDelete: "cascade" }),
  visitId: integer("visit_id").references(() => visits.id, { onDelete: "cascade" }),
  quantityUsed: integer("quantity_used").notNull(),
  usageDate: timestamp("usage_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  visits: many(visits),
  payments: many(payments),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  payments: many(payments),
  inventoryUsage: many(inventoryUsage),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
  visit: one(visits, {
    fields: [payments.visitId],
    references: [visits.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ many }) => ({
  usage: many(inventoryUsage),
}));

export const inventoryUsageRelations = relations(inventoryUsage, ({ one }) => ({
  inventory: one(inventory, {
    fields: [inventoryUsage.inventoryId],
    references: [inventory.id],
  }),
  visit: one(visits, {
    fields: [inventoryUsage.visitId],
    references: [visits.id],
  }),
}));

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits, {
  charges: z.string().transform((val) => parseFloat(val)),
  visitDate: z.string().transform((val) => new Date(val)),
}).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments, {
  amount: z.string().transform((val) => parseFloat(val)),
  paymentDate: z.string().transform((val) => new Date(val)),
}).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory, {
  unitPrice: z.string().optional().transform((val) => {
    if (!val || val === "") return undefined;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  }),
  lastRestocked: z.string().optional().transform((val) => {
    if (!val || val === "") return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  currentStock: z.number().min(0, "Current stock must be 0 or greater"),
  minStockLevel: z.number().min(0, "Minimum stock level must be 0 or greater"),
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryUsageSchema = createInsertSchema(inventoryUsage).omit({
  id: true,
  createdAt: true,
});

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type InventoryUsage = typeof inventoryUsage.$inferSelect;
export type InsertInventoryUsage = z.infer<typeof insertInventoryUsageSchema>;
