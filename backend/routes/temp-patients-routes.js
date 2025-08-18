import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const FK = 10;

// Get all temp patients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tempPatients = await prisma.temp_patients.findMany({
      where: {
        converted_to: null // Only get unconverted temp patients
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    res.json(tempPatients);
  } catch (error) {
    console.error('Error fetching temp patients:', error);
    res.status(500).json({ error: 'Failed to fetch temp patients' });
  }
});

// Search temp patients
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long'
      });
    }

    const tempPatients = await prisma.temp_patients.findMany({
      where: {
        AND: [
          { converted_to: null }, // Only unconverted temp patients
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { temp_patient_id: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone_number: { contains: q } }
            ]
          }
        ]
      },
      select: {
        temp_patient_id: true,
        name: true,
        email: true,
        phone_number: true
      },
      take: 20,
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(tempPatients);

  } catch (error) {
    console.error('Temp patient search error:', error);
    res.status(500).json({ 
      error: 'Failed to search temp patients',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

  // Create temp patient
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone_number, email } = req.body;

    // Validate required fields
    if (!name || !phone_number) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    // Generate unique temp_patient_id with knrstemp prefix
    let suffix = 1;
    let newTempPatientId;
    let isUnique = false;

    while (!isUnique) {
      newTempPatientId = `knrstemp${String(suffix).padStart(3, '0')}`;
      const exists = await prisma.temp_patients.findUnique({
        where: { temp_patient_id: newTempPatientId }
      });
      if (!exists) {
        isUnique = true;
      } else {
        suffix++;
      }
    }

    const tempPatient = await prisma.temp_patients.create({
      data: {
        temp_patient_id: newTempPatientId,
        name,
        phone_number,
        email: email || null
      }
    });

    res.status(201).json(tempPatient);
  } catch (error) {
    console.error('Error creating temp patient:', error);
    res.status(500).json({ error: 'Failed to create temp patient' });
  }
});// Convert temp patient to full patient

router.post('/:temp_patient_id/convert', authenticateToken, async (req, res) => {
  try {
    const { temp_patient_id } = req.params;
    const {
      password,
      email,
      address,
      nic,
      blood_group,
      date_of_birth,
      gender,
      profile_picture
    } = req.body;

    // Get temp patient details
    const tempPatient = await prisma.temp_patients.findUnique({
      where: { temp_patient_id }
    });

    if (!tempPatient) {
      return res.status(404).json({ error: 'Temp patient not found' });
    }

    if (tempPatient.converted_to) {
      return res.status(400).json({ error: 'Temp patient already converted' });
    }

    // Generate password if not provided
    let finalPassword = password;
    let passwordGenerated = false;
    if (!finalPassword || finalPassword.trim() === '') {
      finalPassword = Math.floor(100000 + Math.random() * 900000).toString();
      passwordGenerated = true;
    }

    // Use temp patient email if no new email provided
    const finalEmail = email || tempPatient.email;

    if (!finalEmail) {
      return res.status(400).json({ error: 'Email is required for full patient registration' });
    }

    // Check for existing email (excluding the temp patient's current email)
    const existingByEmail = await prisma.patients.findUnique({ 
      where: { email: finalEmail } 
    });
    if (existingByEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Check for existing NIC
    if (nic) {
      const existingByNic = await prisma.patients.findUnique({ where: { nic } });
      if (existingByNic) {
        return res.status(409).json({ error: 'NIC already exists' });
      }
    }

    // Generate unique patient_id
    let suffix = 1;
    let newPatient_id;
    let isUnique = false;

    while (!isUnique) {
      newPatient_id = `P${String(suffix).padStart(3, '0')}`;
      const exists = await prisma.patients.findUnique({
        where: { patient_id: newPatient_id }
      });
      if (!exists) {
        isUnique = true;
      } else {
        suffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(finalPassword, FK);

    // Create full patient
    const patient = await prisma.patients.create({
      data: {
        patient_id: newPatient_id,
        password: hashedPassword,
        name: tempPatient.name,
        profile_picture,
        email: finalEmail,
        phone_number: tempPatient.phone_number,
        address,
        nic,
        blood_group,
        date_of_birth,
        gender,
      },
    });

    // Update temp patient record
    await prisma.temp_patients.update({
      where: { temp_patient_id },
      data: {
        converted_to: patient.patient_id,
        converted_at: new Date()
      }
    });

    // Get all appointments for this temp patient to send confirmations
    const appointments = await prisma.appointments.findMany({
      where: { temp_patient_id },
      include: {
        dentist: true
      }
    });

    // Update appointments to point to full patient and set status to confirmed
    await prisma.appointments.updateMany({
      where: { temp_patient_id },
      data: {
        patient_id: patient.patient_id,
        temp_patient_id: null,
        status: 'confirmed'  // Set status to confirmed when converting temp patient
      }
    });

    // Import email sending function
    const { sendAppointmentConfirmation } = await import('../utils/mailer.js');
    const { sendAppointmentConfirmationWhatsApp } = await import('../utils/whatsapp.js');

    // Send confirmation for each appointment
    for (const appointment of appointments) {
      if (patient.email) {
        try {
          await sendAppointmentConfirmation(
            patient.email,
            appointment.date,
            appointment.time_from
          );
          
          if (patient.phone_number) {
            await sendAppointmentConfirmationWhatsApp(
              patient.phone_number,
              appointment.date,
              appointment.time_from
            );
          }
        } catch (emailError) {
          console.error('Error sending confirmation email/WhatsApp:', emailError);
          // Continue with other appointments even if one fails
        }
      }
    }

    res.status(201).json({ 
      patient, 
      converted: true,
      passwordGenerated,
      generatedPassword: passwordGenerated ? finalPassword : undefined,
      appointmentsUpdated: appointments.length
    });

  } catch (error) {
    console.error('Error converting temp patient:', error);
    res.status(500).json({ error: 'Failed to convert temp patient' });
  }
});

// Get temp patient by ID
router.get('/:temp_patient_id', authenticateToken, async (req, res) => {
  try {
    const tempPatient = await prisma.temp_patients.findUnique({
      where: { temp_patient_id: req.params.temp_patient_id },
      include: {
        appointments: {
          include: {
            dentist: {
              select: {
                dentist_id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!tempPatient) {
      return res.status(404).json({ error: 'Temp patient not found' });
    }

    res.json(tempPatient);
  } catch (error) {
    console.error('Error fetching temp patient:', error);
    res.status(500).json({ error: 'Failed to fetch temp patient' });
  }
});

//Delete a temp patient
router.delete('/:temp_patient_id', authenticateToken, async(req, res)=>{
  try{
    await prisma.temp_patients.delete({where:{temp_patient_id: req.params.temp_patient_id}});
    res.json("Deleted Successfully");
  }
  catch(err){
    console.log(err);
    res.status(500).json(`Error deleting temp patient: ${err.message}`);
  }
})

export default router;
