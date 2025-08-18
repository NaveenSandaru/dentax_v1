import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all treatments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const treatments = await prisma.treatment.findMany({
      orderBy: {
        no: 'asc'
      }
    });
    res.json(treatments);
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

// Get treatment by ID (no)
router.get('/:no', authenticateToken, async (req, res) => {
  const no = parseInt(req.params.no);
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { no }
    });

    if (!treatment) {
      return res.status(404).json({ error: 'Treatment not found' });
    }

    res.json(treatment);
  } catch (error) {
    console.error('Error fetching treatment:', error);
    res.status(500).json({ error: 'Failed to fetch treatment' });
  }
});

// Create a new treatment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { treatment_group } = req.body;

    if (!treatment_group || treatment_group.trim() === '') {
      return res.status(400).json({ error: 'treatment_group is required' });
    }

    const newTreatment = await prisma.treatment.create({
      data: { treatment_group }
    });

    res.status(201).json(newTreatment);
  } catch (error) {
    console.error('Error creating treatment:', error);
    res.status(500).json({ error: 'Failed to create treatment' });
  }
});

// Update treatment by ID
router.put('/:no', authenticateToken, async (req, res) => {
  const no = parseInt(req.params.no);
  const { treatment_group } = req.body;

  if (!treatment_group || treatment_group.trim() === '') {
    return res.status(400).json({ error: 'treatment_group is required' });
  }

  try {
    const existingTreatment = await prisma.treatment.findUnique({ where: { no } });

    if (!existingTreatment) {
      return res.status(404).json({ error: 'Treatment not found' });
    }

    const updated = await prisma.treatment.update({
      where: { no },
      data: { treatment_group }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating treatment:', error);
    res.status(500).json({ error: 'Failed to update treatment' });
  }
});

// Delete treatment by ID
router.delete('/:no', authenticateToken, async (req, res) => {
  const no = parseInt(req.params.no);
  try {
    const existingTreatment = await prisma.treatment.findUnique({ where: { no } });

    if (!existingTreatment) {
      return res.status(404).json({ error: 'Treatment not found' });
    }

    await prisma.treatment.delete({ where: { no } });

    res.json({ message: 'Treatment deleted successfully' });
  } catch (error) {
    console.error('Error deleting treatment:', error);
    res.status(500).json({ error: 'Failed to delete treatment' });
  }
});

export default router;
