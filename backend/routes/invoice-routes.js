import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { 
        patients: true, 
        dentists: true, 
        services: {
          include: {
            service: true
          }
        }
      }
    });

    // Calculate tax_rate and lab_cost for each invoice based on services
    const enrichedInvoices = invoices.map(invoice => {
      const services = invoice.services || [];
      let subtotal = 0;
      let totalTax = 0;
      let totalLabCharge = 0;

      services.forEach(serviceAssign => {
        const service = serviceAssign.service;
        if (service) {
          subtotal += service.amount;
          const taxAmount = (service.amount * Number(service.tax_percentage)) / 100;
          totalTax += taxAmount;
          totalLabCharge += Number(service.Lab_charge || 0);
        }
      });

      const tax_rate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
      
      return {
        ...invoice,
        tax_rate: Number(tax_rate.toFixed(2)),
        lab_cost: Number(totalLabCharge.toFixed(2))
      };
    });

    res.json(enrichedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:invoice_id', authenticateToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoice_id: Number(req.params.invoice_id) },
      include: { 
        patients: true, 
        dentists: true, 
        services: {
          include: {
            service: true
          }
        }
      }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Not found' });

    // Calculate tax_rate and lab_cost based on services
    const services = invoice.services || [];
    let subtotal = 0;
    let totalTax = 0;
    let totalLabCharge = 0;

    services.forEach(serviceAssign => {
      const service = serviceAssign.service;
      if (service) {
        subtotal += service.amount;
        const taxAmount = (service.amount * Number(service.tax_percentage)) / 100;
        totalTax += taxAmount;
        totalLabCharge += Number(service.Lab_charge || 0);
      }
    });

    const tax_rate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
    
    const enrichedInvoice = {
      ...invoice,
      tax_rate: Number(tax_rate.toFixed(2)),
      lab_cost: Number(totalLabCharge.toFixed(2))
    };

    res.json(enrichedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patient_id, dentist_id, payment_type, discount, date, note, services } = req.body;
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Services are required' });
    }

    // First, get service details to calculate totals
    const serviceDetails = await prisma.invoice_services.findMany({
      where: {
        service_id: {
          in: services
        }
      }
    });

    if (serviceDetails.length !== services.length) {
      return res.status(400).json({ error: 'One or more services not found' });
    }

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalLabCharge = 0;

    serviceDetails.forEach(service => {
      subtotal += service.amount;
      const taxAmount = (service.amount * Number(service.tax_percentage)) / 100;
      totalTax += taxAmount;
      totalLabCharge += Number(service.Lab_charge || 0);
    });

    const discountAmount = Number(discount || 0);
    const total_amount = subtotal + totalTax + totalLabCharge - discountAmount;

    // Create the invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        patient_id,
        dentist_id,
        payment_type,
        discount: discountAmount,
        date: date ? new Date(date) : new Date(),
        total_amount,
        note
      },
    });

    // Assign services to the invoice
    const serviceAssignments = services.map(service_id => ({
      invoice_id: newInvoice.invoice_id,
      service_id: Number(service_id)
    }));

    await prisma.invoice_service_assign.createMany({
      data: serviceAssignments
    });

    // Return the invoice with calculated fields
    const tax_rate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
    
    const enrichedInvoice = {
      ...newInvoice,
      tax_rate: Number(tax_rate.toFixed(2)),
      lab_cost: Number(totalLabCharge.toFixed(2))
    };

    res.status(201).json(enrichedInvoice);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.put('/:invoice_id', authenticateToken, async (req, res) => {
  try {
    const { patient_id, dentist_id, payment_type, discount, date, note, services } = req.body;
    const invoice_id = Number(req.params.invoice_id);

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoice_id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (services && Array.isArray(services)) {
      // If services are provided, recalculate totals
      const serviceDetails = await prisma.invoice_services.findMany({
        where: {
          service_id: {
            in: services
          }
        }
      });

      if (serviceDetails.length !== services.length) {
        return res.status(400).json({ error: 'One or more services not found' });
      }

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;
      let totalLabCharge = 0;

      serviceDetails.forEach(service => {
        subtotal += service.amount;
        const taxAmount = (service.amount * Number(service.tax_percentage)) / 100;
        totalTax += taxAmount;
        totalLabCharge += Number(service.Lab_charge || 0);
      });

      const discountAmount = Number(discount || existingInvoice.discount);
      const total_amount = subtotal + totalTax + totalLabCharge - discountAmount;

      // Update the invoice with calculated total
      const updateData = {
        patient_id: patient_id || existingInvoice.patient_id,
        dentist_id: dentist_id || existingInvoice.dentist_id,
        payment_type: payment_type || existingInvoice.payment_type,
        discount: discountAmount,
        total_amount,
        note: note !== undefined ? note : existingInvoice.note
      };

      if (date) updateData.date = new Date(date);

      const updatedInvoice = await prisma.invoice.update({
        where: { invoice_id },
        data: updateData,
      });

      // Return with calculated fields
      const tax_rate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
      
      const enrichedInvoice = {
        ...updatedInvoice,
        tax_rate: Number(tax_rate.toFixed(2)),
        lab_cost: Number(totalLabCharge.toFixed(2))
      };

      res.json(enrichedInvoice);
    } else {
      // If no services provided, just update basic fields
      const updateData = {};
      if (patient_id !== undefined) updateData.patient_id = patient_id;
      if (dentist_id !== undefined) updateData.dentist_id = dentist_id;
      if (payment_type !== undefined) updateData.payment_type = payment_type;
      if (discount !== undefined) updateData.discount = Number(discount);
      if (note !== undefined) updateData.note = note;
      if (date) updateData.date = new Date(date);

      const updatedInvoice = await prisma.invoice.update({
        where: { invoice_id },
        data: updateData,
      });

      // Get current services to calculate tax_rate and lab_cost
      const services = await prisma.invoice_service_assign.findMany({
        where: { invoice_id },
        include: { service: true }
      });

      let subtotal = 0;
      let totalTax = 0;
      let totalLabCharge = 0;

      services.forEach(serviceAssign => {
        const service = serviceAssign.service;
        if (service) {
          subtotal += service.amount;
          const taxAmount = (service.amount * Number(service.tax_percentage)) / 100;
          totalTax += taxAmount;
          totalLabCharge += Number(service.Lab_charge || 0);
        }
      });

      const tax_rate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
      
      const enrichedInvoice = {
        ...updatedInvoice,
        tax_rate: Number(tax_rate.toFixed(2)),
        lab_cost: Number(totalLabCharge.toFixed(2))
      };

      res.json(enrichedInvoice);
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:invoice_id', authenticateToken, async (req, res) => {
  try {
    await prisma.invoice.delete({
      where: { invoice_id: Number(req.params.invoice_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
