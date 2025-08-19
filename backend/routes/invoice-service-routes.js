import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Treatment group routes (must come before /:service_id routes)
router.get('/treatment-groups', authenticateToken, async (req, res) => {
  try {
    const treatmentGroups = await prisma.treatment.findMany({
      include: {
        invoice_services: true
      }
    });
    res.json(treatmentGroups);
  } catch (error) {
    console.error('Error fetching treatment groups:', error);
    res.status(500).json({ error: 'Failed to fetch treatment groups' });
  }
});

router.post('/treatment-groups', authenticateToken, async (req, res) => {
  try {
    const { treatment_group } = req.body;
    const newTreatmentGroup = await prisma.treatment.create({
      data: { treatment_group }
    });
    res.status(201).json(newTreatmentGroup);
  } catch (error) {
    console.error('Error creating treatment group:', error);
    res.status(500).json({ error: 'Failed to create treatment group' });
  }
});

router.put('/treatment-groups/:id', authenticateToken, async (req, res) => {
  try {
    const { treatment_group } = req.body;
    const updatedTreatmentGroup = await prisma.treatment.update({
      where: { no: Number(req.params.id) },
      data: { treatment_group }
    });
    res.json(updatedTreatmentGroup);
  } catch (error) {
    console.error('Error updating treatment group:', error);
    res.status(500).json({ error: 'Failed to update treatment group' });
  }
});

router.delete('/treatment-groups/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.treatment.delete({
      where: { no: Number(req.params.id) },
    });
    res.json({ message: 'Treatment group deleted successfully' });
  } catch (error) {
    console.error('Error deleting treatment group:', error);
    res.status(500).json({ error: 'Failed to delete treatment group' });
  }
});

router.get('/', async (req, res) => {
  try {
    const services = await prisma.invoice_services.findMany({
      include: {
        treatment: true
      }
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching invoice services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get services for a specific dentist
router.get('/dentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const { dentist_id } = req.params;
    
    // Get services assigned to the dentist through dentist_service_assign table
    const dentistWithServices = await prisma.dentists.findUnique({
      where: { dentist_id },
      include: {
        dentist_service_assign: {
          include: {
            invoice_services: {
              include: {
                treatment: true
              }
            }
          }
        }
      }
    });
    
    if (!dentistWithServices) {
      return res.status(404).json({ error: 'Dentist not found' });
    }
    
    // Extract services from the assignments
    const services = dentistWithServices.dentist_service_assign.map(
      assignment => assignment.invoice_services
    );
    
    // If dentist has assigned services, return them
    if (services.length > 0) {
      return res.json(services);
    }
    
    // If no specific services assigned, return all active services
    const allServices = await prisma.invoice_services.findMany({
      where: {
        is_active: true
      },
      include: {
        treatment: true
      }
    });
    
    res.json(allServices);
  } catch (error) {
    console.error('Error fetching dentist services:', error);
    res.status(500).json({ error: 'Failed to fetch services for dentist' });
  }
});

router.get('/:service_id', authenticateToken, async (req, res) => {
  try {
    const service = await prisma.invoice_services.findUnique({
      where: { service_id: Number(req.params.service_id) },
      include: {
        treatment: true
      }
    });
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      service_name,
      amount,
      description,
      ref_code,
      tax_type,
      tax_percentage,
      treatment_group,
      treatment_type,
      consumable_charge,
      lab_charge,
      is_active,
      duration
    } = req.body;

    const newService = await prisma.invoice_services.create({
      data: {
        service_name,
        amount,
        description,
        ref_code,
        tax_type,
        tax_percentage: tax_percentage || 0,
        treatment_group,
        treatment_type,
        Consumable_charge: consumable_charge || 0,
        Lab_charge: lab_charge || 0,
        is_active: is_active || false,
        duration: duration
      },
      include: {
        treatment: true
      }
    });
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating invoice service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/:service_id', authenticateToken, async (req, res) => {
  try {
    const {
      service_name,
      amount,
      description,
      ref_code,
      tax_type,
      tax_percentage,
      treatment_group_no,
      treatment_type,
      Consumable_charge,
      Lab_charge,
      is_active,
      duration
    } = req.body;

    const updatedService = await prisma.invoice_services.update({
      where: { service_id: Number(req.params.service_id) },
      data: {
        service_name,
        amount,
        description,
        ref_code,
        tax_type,
        tax_percentage,
        treatment_group: treatment_group_no,
        treatment_type,
        Consumable_charge: Consumable_charge,
        Lab_charge: Lab_charge,
        is_active: is_active,
        duration: duration
      },
      include: {
        treatment: true
      }
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating invoice service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:service_id', authenticateToken, async (req, res) => {
  try {
    await prisma.invoice_services.delete({
      where: { service_id: Number(req.params.service_id) },
    });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
