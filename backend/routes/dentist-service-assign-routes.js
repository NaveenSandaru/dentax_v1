import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all dentist service assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const assignments = await prisma.dentist_service_assign.findMany({
      include: {
        dentists: {
          select: {
            dentist_id: true,
            name: true,
            email: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true,
            description: true
          }
        }
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching dentist service assignments:', error);
    res.status(500).json({ error: 'Failed to fetch dentist service assignments' });
  }
});

// Get services assigned to a specific dentist
router.get('/dentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const assignments = await prisma.dentist_service_assign.findMany({
      where: { dentist_id: req.params.dentist_id },
      include: {
        invoice_services: {
          include: {
            treatment: true
          }
        }
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments for dentist:', error);
    res.status(500).json({ error: 'Failed to fetch assignments for dentist' });
  }
});

// Get dentists assigned to a specific service
router.get('/service/:service_id', authenticateToken, async (req, res) => {
  try {
    const assignments = await prisma.dentist_service_assign.findMany({
      where: { service_id: parseInt(req.params.service_id) },
      include: {
        dentists: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            phone_number: true,
            profile_picture: true
          }
        }
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments for service:', error);
    res.status(500).json({ error: 'Failed to fetch assignments for service' });
  }
});

// Assign a service to a dentist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { dentist_id, service_id } = req.body;
    
    // Check if the assignment already exists
    const existingAssignment = await prisma.dentist_service_assign.findUnique({
      where: {
        dentist_id_service_id: {
          dentist_id: dentist_id,
          service_id: parseInt(service_id)
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Service is already assigned to this dentist' });
    }

    const newAssignment = await prisma.dentist_service_assign.create({
      data: {
        dentist_id: dentist_id,
        service_id: parseInt(service_id)
      },
      include: {
        dentists: {
          select: {
            dentist_id: true,
            name: true,
            email: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true,
            description: true
          }
        }
      }
    });
    
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating dentist service assignment:', error);
    res.status(500).json({ 
      error: 'Failed to create dentist service assignment',
      details: error.message 
    });
  }
});

// Assign multiple services to a dentist
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { dentist_id, service_ids } = req.body;
    
    if (!Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ error: 'service_ids must be a non-empty array' });
    }

    // Check for existing assignments
    const existingAssignments = await prisma.dentist_service_assign.findMany({
      where: {
        dentist_id: dentist_id,
        service_id: { in: service_ids.map(id => parseInt(id)) }
      }
    });

    if (existingAssignments.length > 0) {
      const existingServiceIds = existingAssignments.map(a => a.service_id);
      return res.status(400).json({ 
        error: 'Some services are already assigned to this dentist',
        existing_service_ids: existingServiceIds
      });
    }

    // Create assignments
    const assignmentData = service_ids.map(service_id => ({
      dentist_id: dentist_id,
      service_id: parseInt(service_id)
    }));

    const newAssignments = await prisma.dentist_service_assign.createMany({
      data: assignmentData
    });
    
    // Fetch the created assignments with include
    const createdAssignments = await prisma.dentist_service_assign.findMany({
      where: {
        dentist_id: dentist_id,
        service_id: { in: service_ids.map(id => parseInt(id)) }
      },
      include: {
        dentists: {
          select: {
            dentist_id: true,
            name: true,
            email: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true,
            description: true
          }
        }
      }
    });
    
    res.status(201).json(createdAssignments);
  } catch (error) {
    console.error('Error creating batch dentist service assignments:', error);
    res.status(500).json({ 
      error: 'Failed to create dentist service assignments',
      details: error.message 
    });
  }
});

// Remove a service assignment from a dentist
router.delete('/:dentist_id/:service_id', authenticateToken, async (req, res) => {
  try {
    const { dentist_id, service_id } = req.params;

    // Check if assignment exists
    const existingAssignment = await prisma.dentist_service_assign.findUnique({
      where: {
        dentist_id_service_id: {
          dentist_id: dentist_id,
          service_id: parseInt(service_id)
        }
      }
    });
    
    if (!existingAssignment) {
      return res.status(404).json({ error: 'Service assignment not found' });
    }

    await prisma.dentist_service_assign.delete({
      where: {
        dentist_id_service_id: {
          dentist_id: dentist_id,
          service_id: parseInt(service_id)
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting dentist service assignment:', error);
    res.status(500).json({ 
      error: 'Failed to delete dentist service assignment',
      details: error.message 
    });
  }
});

// Remove all service assignments for a dentist
router.delete('/dentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const { dentist_id } = req.params;

    await prisma.dentist_service_assign.deleteMany({
      where: {
        dentist_id: dentist_id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all dentist service assignments:', error);
    res.status(500).json({ 
      error: 'Failed to delete dentist service assignments',
      details: error.message 
    });
  }
});

// Replace all service assignments for a dentist
router.put('/dentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const { dentist_id } = req.params;
    const { service_ids } = req.body;
    
    if (!Array.isArray(service_ids)) {
      return res.status(400).json({ error: 'service_ids must be an array' });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Remove all existing assignments
      await tx.dentist_service_assign.deleteMany({
        where: {
          dentist_id: dentist_id
        }
      });

      // Create new assignments if service_ids is not empty
      if (service_ids.length > 0) {
        const assignmentData = service_ids.map(service_id => ({
          dentist_id: dentist_id,
          service_id: parseInt(service_id)
        }));

        await tx.dentist_service_assign.createMany({
          data: assignmentData
        });

        // Fetch the created assignments with include
        return await tx.dentist_service_assign.findMany({
          where: {
            dentist_id: dentist_id
          },
          include: {
            dentists: {
              select: {
                dentist_id: true,
                name: true,
                email: true
              }
            },
            invoice_services: {
              select: {
                service_id: true,
                service_name: true,
                amount: true,
                description: true
              }
            }
          }
        });
      }

      return [];
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error replacing dentist service assignments:', error);
    res.status(500).json({ 
      error: 'Failed to update dentist service assignments',
      details: error.message 
    });
  }
});

export default router;
