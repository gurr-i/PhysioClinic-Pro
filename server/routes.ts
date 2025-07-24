import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { dbBackup } from "./backup";
import { insertPatientSchema, insertVisitSchema, insertPaymentSchema, insertInventorySchema } from "@shared/schema";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  // Patients routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, patientData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePatient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Visits routes
  app.get("/api/visits", async (req, res) => {
    try {
      const visits = await storage.getVisits();
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  app.get("/api/patients/:patientId/visits", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visits = await storage.getVisitsByPatient(patientId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient visits" });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse(req.body);
      const visit = await storage.createVisit(visitData);
      res.status(201).json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create visit" });
    }
  });

  app.put("/api/visits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const visitData = insertVisitSchema.partial().parse(req.body);
      const visit = await storage.updateVisit(id, visitData);
      res.json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update visit" });
    }
  });

  app.get("/api/visits/:id/payments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payments = await storage.getPaymentsByVisit(id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visit payments" });
    }
  });

  app.delete("/api/visits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if visit has associated payments
      const payments = await storage.getPaymentsByVisit(id);
      if (payments.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete visit with associated payments", 
          paymentsCount: payments.length 
        });
      }
      
      await storage.deleteVisit(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete visit" });
    }
  });

  // Payments routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/patients/:patientId/payments", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const payments = await storage.getPaymentsByPatient(patientId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const paymentData = insertPaymentSchema.partial().parse(req.body);
      const payment = await storage.updatePayment(id, paymentData);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePayment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(inventoryData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, inventoryData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  app.post("/api/inventory/:id/reduce", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const item = await storage.reduceInventoryStock(id, quantity);
      res.json(item);
    } catch (error) {
      if (error instanceof Error && error.message === "Insufficient stock") {
        return res.status(400).json({ message: "Insufficient stock available" });
      }
      res.status(500).json({ message: "Failed to reduce inventory stock" });
    }
  });

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Database Backup & Restore
  app.post("/api/database/backup", async (req, res) => {
    try {
      const { filename } = req.body;
      const backupPath = await dbBackup.createBackup(filename);
      res.json({ 
        success: true, 
        filename: path.basename(backupPath),
        path: backupPath
      });
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.get("/api/database/backups", async (req, res) => {
    try {
      const backups = await dbBackup.listBackups();
      const backupsWithDetails = backups.map(filename => {
        const filePath = dbBackup.getBackupPath(filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          created: stats.mtime,
        };
      });
      res.json(backupsWithDetails);
    } catch (error) {
      console.error("Error listing backups:", error);
      res.status(500).json({ error: "Failed to list backups" });
    }
  });

  app.post("/api/database/restore", async (req, res) => {
    try {
      const { filename } = req.body;
      await dbBackup.restoreBackup(filename);
      res.json({ success: true });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  app.delete("/api/database/backups/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      await dbBackup.deleteBackup(filename);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete backup error:", error);
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  app.get("/api/database/backups/:filename/download", async (req, res) => {
    try {
      const { filename } = req.params;
      const backupPath = dbBackup.getBackupPath(filename);

      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: "Backup file not found" });
      }

      res.download(backupPath, filename);
    } catch (error) {
      console.error("Download backup error:", error);
      res.status(500).json({ error: "Failed to download backup" });
    }
  });
  
  return server;
}