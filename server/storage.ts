import { 
  patients, visits, payments, inventory, inventoryUsage,
  type Patient, type InsertPatient,
  type Visit, type InsertVisit,
  type Payment, type InsertPayment,
  type Inventory, type InsertInventory,
  type InventoryUsage, type InsertInventoryUsage
} from "@shared/schema";
import { db, dbPromise } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

// Helper function to ensure database is initialized
async function ensureDbReady() {
  await dbPromise;
  return db;
}

export interface IStorage {
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Visits
  getVisits(): Promise<(Visit & { patient: Patient })[]>;
  getVisitsByPatient(patientId: number): Promise<Visit[]>;
  getVisit(id: number): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, visit: Partial<InsertVisit>): Promise<Visit>;
  deleteVisit(id: number): Promise<void>;

  // Payments
  getPayments(): Promise<(Payment & { patient: Patient })[]>;
  getPaymentsByPatient(patientId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;

  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventoryItem(id: number): Promise<void>;
  getLowStockItems(): Promise<Inventory[]>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    monthlyRevenue: number;
    outstandingBalance: number;
    todaysVisits: number;
    monthlyVisitTrends: { month: string; visits: number }[];
    revenueData: { month: string; revenue: number; outstanding: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Patients
  async getPatients(): Promise<Patient[]> {
    const database = await ensureDbReady();
    return await database.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const database = await ensureDbReady();
    const [patient] = await database.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const database = await ensureDbReady();
    const [newPatient] = await database.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient> {
    const database = await ensureDbReady();
    const [updatedPatient] = await database
      .update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<void> {
    const database = await ensureDbReady();
    await database.delete(patients).where(eq(patients.id, id));
  }

  // Balance Management
  async updatePatientBalance(patientId: number, amount: number, type: 'charge' | 'payment' | 'advance'): Promise<void> {
    const patient = await this.getPatient(patientId);
    if (!patient) throw new Error("Patient not found");

    let balanceChange = 0;
    switch (type) {
      case 'charge':
        balanceChange = -amount; // Negative for charges (patient owes money)
        break;
      case 'payment':
        balanceChange = amount; // Positive for payments (reduces debt)
        break;
      case 'advance':
        balanceChange = amount; // Positive for advance payments (credit balance)
        break;
    }

    const currentBalance = parseFloat(patient.balance?.toString() || '0');
    const newBalance = currentBalance + balanceChange;

    const database = await ensureDbReady();
    await database
      .update(patients)
      .set({ balance: newBalance.toString() })
      .where(eq(patients.id, patientId));
  }

  // Visits
  async getVisits(): Promise<(Visit & { patient: Patient, hasPayment?: boolean })[]> {
    const database = await ensureDbReady();
    const visitsData = await database
      .select({
        id: visits.id,
        patientId: visits.patientId,
        visitDate: visits.visitDate,
        treatmentProvided: visits.treatmentProvided,
        duration: visits.duration,
        notes: visits.notes,
        charges: visits.charges,
        createdAt: visits.createdAt,
        patient: patients,
      })
      .from(visits)
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .orderBy(desc(visits.visitDate));

    // Add payment information to each visit
    for (const visit of visitsData) {
      const visitPayments = await this.getPaymentsByVisit(visit.id);
      visit.hasPayment = visitPayments.length > 0;
    }

    return visitsData;
  }

  async getVisitsByPatient(patientId: number): Promise<Visit[]> {
    const database = await ensureDbReady();
    return await database
      .select()
      .from(visits)
      .where(eq(visits.patientId, patientId))
      .orderBy(desc(visits.visitDate));
  }

  async getVisit(id: number): Promise<Visit | undefined> {
    const database = await ensureDbReady();
    const [visit] = await database.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const database = await ensureDbReady();
    const [newVisit] = await database.insert(visits).values({
      ...visit,
      charges: visit.charges.toString()
    }).returning();

    // Update patient balance (negative for charges)
    await this.updatePatientBalance(visit.patientId, parseFloat(visit.charges.toString()), 'charge');

    return newVisit;
  }

  async updateVisit(id: number, visit: Partial<InsertVisit>): Promise<Visit> {
    const updateData = { ...visit };
    if (updateData.charges !== undefined) {
      updateData.charges = updateData.charges.toString() as any;
    }
    const [updatedVisit] = await db
      .update(visits)
      .set(updateData)
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }

  async deleteVisit(id: number): Promise<void> {
    await db.delete(visits).where(eq(visits.id, id));
  }

  // Payments
  async getPayments(): Promise<(Payment & { patient: Patient })[]> {
    return await db
      .select({
        id: payments.id,
        patientId: payments.patientId,
        visitId: payments.visitId,
        amount: payments.amount,
        paymentType: payments.paymentType,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        notes: payments.notes,
        createdAt: payments.createdAt,
        patient: patients,
      })
      .from(payments)
      .innerJoin(patients, eq(payments.patientId, patients.id))
      .orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByPatient(patientId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.patientId, patientId))
      .orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByVisit(visitId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.visitId, visitId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values({
      ...payment,
      amount: payment.amount.toString()
    }).returning();

    // Update patient balance based on payment type
    const balanceType = payment.paymentType === 'advance' ? 'advance' : 'payment';
    await this.updatePatientBalance(payment.patientId, parseFloat(payment.amount.toString()), balanceType);

    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const updateData = { ...payment };
    if (updateData.amount !== undefined) {
      updateData.amount = updateData.amount.toString() as any;
    }
    const [updatedPayment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(inventory.name);
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async createInventoryItem(data: InsertInventory): Promise<Inventory> {
    // Clean the data to remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const [item] = await db.insert(inventory)
      .values(cleanData)
      .returning();

    return item;
  }

  async updateInventoryItem(id: number, data: Partial<InsertInventory>): Promise<Inventory> {
    // Clean the data to remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const [item] = await db.update(inventory)
      .set(cleanData)
      .where(eq(inventory.id, id))
      .returning();

    if (!item) {
      throw new Error("Inventory item not found");
    }

    return item;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async reduceInventoryStock(id: number, quantity: number): Promise<Inventory> {
    const item = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);

    if (!item.length) {
      throw new Error("Item not found");
    }

    const currentItem = item[0];
    const newStock = currentItem.currentStock - quantity;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    const [updatedItem] = await db
      .update(inventory)
      .set({ currentStock: newStock })
      .where(eq(inventory.id, id))
      .returning();

    return updatedItem;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(sql`${inventory.currentStock} <= ${inventory.minStockLevel}`)
      .orderBy(inventory.currentStock);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    monthlyRevenue: number;
    outstandingBalance: number;
    todaysVisits: number;
    monthlyVisitTrends: { month: string; visits: number }[];
    revenueData: { month: string; revenue: number; outstanding: number }[];
  }> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Total patients
    const [{ count: totalPatients }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);

    // Monthly revenue (current month) - based on actual payments received
    const [{ revenue: monthlyRevenue }] = await db
      .select({ revenue: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(
        gte(payments.paymentDate, currentMonth),
        eq(payments.paymentType, 'payment')
      ));

    // Outstanding balance calculation (only count regular payments, not advances)
    const totalCharges = await db
      .select({ total: sql<number>`coalesce(sum(${visits.charges}), 0)` })
      .from(visits);

    const totalPayments = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.paymentType, 'payment'));

    const outstandingBalance = parseFloat(totalCharges[0].total.toString()) - parseFloat(totalPayments[0].total.toString());

    // Today's visits
    const [{ count: todaysVisits }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(visits)
      .where(and(
        gte(visits.visitDate, startOfDay),
        lte(visits.visitDate, endOfDay)
      ));

    // Monthly visit trends (last 12 months)
    const monthlyVisitTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(visits)
        .where(and(
          gte(visits.visitDate, monthStart),
          lte(visits.visitDate, monthEnd)
        ));

      monthlyVisitTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        visits: count,
      });
    }

    // Revenue data (last 6 months)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [{ revenue }] = await db
        .select({ revenue: sql<number>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(and(
          gte(payments.paymentDate, monthStart),
          lte(payments.paymentDate, monthEnd),
          eq(payments.paymentType, 'payment')
        ));

      // Calculate outstanding for this month
      const totalChargesMonth = await db
        .select({ total: sql<number>`coalesce(sum(${visits.charges}), 0)` })
        .from(visits)
        .where(and(
          gte(visits.visitDate, monthStart),
          lte(visits.visitDate, monthEnd)
        ));

      const totalPaymentsMonth = await db
        .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .innerJoin(visits, eq(payments.visitId, visits.id))
        .where(and(
          eq(payments.paymentType, 'payment'),
          gte(visits.visitDate, monthStart),
          lte(visits.visitDate, monthEnd)
        ));

      const outstandingMonth = parseFloat(totalChargesMonth[0].total.toString()) - parseFloat(totalPaymentsMonth[0].total.toString());

      revenueData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(revenue.toString()),
        outstanding: Math.max(0, outstandingMonth),
      });
    }

    return {
      totalPatients,
      monthlyRevenue: parseFloat(monthlyRevenue.toString()),
      outstandingBalance: Math.max(0, outstandingBalance),
      todaysVisits,
      monthlyVisitTrends,
      revenueData,
    };
  }
}

export const storage = new DatabaseStorage();