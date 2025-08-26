import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { authenticateToken } from '../middleware/authentication.js';
import { sendAppointmentConfirmation, sendtempAppointment, sendAppointmentCancelation, sendAppointmentRescheduleNotice } from '../utils/mailer.js';
import { sendAppointmentConfirmationWhatsApp, sendtempAppointmentWhatsApp, sendAppointmentCancellationWhatsApp, sendAppointmentRescheduleWhatsApp } from '../utils/whatsapp.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        temp_patient: {
          select: {
            temp_patient_id: true,
            name: true,
            email: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/fordentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: { dentist_id: req.params.dentist_id },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        temp_patient: {
          select: {
            temp_patient_id: true,
            name: true,
            email: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/forpatient/:patient_id', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: { patient_id: req.params.patient_id },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/today/fordentist/:dentist_id', async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: req.params.dentist_id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/fordentist/patients/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const dentistId = req.params.dentist_id;

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: dentistId,
        patient_id: { not: null }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            profile_picture: true,
            email: true,
            phone_number: true,
            address: true,
            nic: true,
            blood_group: true,
            date_of_birth: true,
            gender: true
          }
        }
      }
    });

    // Extract unique patients
    const uniquePatients = Array.from(
      new Map(
        appointments.map(app => [app.patient.patient_id, app.patient])
      ).values()
    );

    res.json(uniquePatients);
  } catch (error) {
    console.error("Error fetching patients for dentist:", error);
    res.status(500).json({ error: "Failed to fetch patients for this dentist" });
  }
});

router.get('/today/forpatient/:patient_id', authenticateToken, async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: req.params.patient_id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/today', authenticateToken, async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        temp_patient: {
          select: {
            temp_patient_id: true,
            name: true,
            email: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        invoice_services: {
          select: {
            service_id: true,
            service_name: true,
            amount: true
          }
        }
      },
      orderBy: {
        time_from: 'asc'
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today', authenticateToken, async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        patient_id: { not: null },
        dentist_id: { not: null },
        NOT: {
          status: 'cancelled'
        }
      }
    });

    res.json(count);
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today-checked-in', authenticateToken, async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: "checkedin",
        NOT: {
          status: 'cancelled'
        },
        patient_id: { not: null },
        dentist_id: { not: null }
      }
    });

    res.json(count);
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today-not-checked-in', authenticateToken, async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ["confirmed", "pending"] },
        NOT: {
          status: 'cancelled'
        },
        patient_id: { not: null },
        dentist_id: { not: null }
      }
    });

    res.json(count);
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/fordentist/upcoming/:dentist_id', authenticateToken, async (req, res) => {
  try {
    // Get today's date in Asia/Colombo (without time)
    const colomboToday = DateTime.now().setZone('Asia/Colombo').toISODate(); // '2025-06-20'

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: req.params.dentist_id,
        date: {
          gt: new Date(colomboToday)
        }
      },
      orderBy: {
        date: 'asc'
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});

router.get('/forpatient/upcoming/:patient_id', authenticateToken, async (req, res) => {
  try {
    // Get today's date in Asia/Colombo (without time)
    const colomboToday = DateTime.now().setZone('Asia/Colombo').toISODate(); // '2025-06-20'

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: req.params.patient_id,
        date: {
          gt: new Date(colomboToday)
        }
      },
      orderBy: {
        date: 'asc'
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});

router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        status: "pending"
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        temp_patient: {
          select: {
            temp_patient_id: true,
            name: true,
            email: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching pending appointments:", error);
    res.status(500).json({ error: "Failed to fetch pending appointments" });
  }
});

router.get('/checkedin', authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        status: "checkedin"
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.appointments.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/pending-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "pending", patient_id: { not: null }, dentist_id: { not: null } } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/completed-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "completed" } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/confirmed-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "confirmed" } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/:appointment_id', authenticateToken, async (req, res) => {
  try {
    const appointment = await prisma.appointments.findUnique({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

router.post('/', async (req, res) => {
  try {
    // Explicitly extract only allowed fields
    const {
      patient_id,
      temp_patient_id,
      dentist_id,
      date,
      time_from,
      time_to,
      fee,
      note,
      status,
      payment_status,
      invoice_service
    } = req.body;

    // Validate that either patient_id or temp_patient_id is provided
    if (!patient_id && !temp_patient_id) {
      return res.status(400).json({ error: 'Either patient_id or temp_patient_id is required' });
    }

    // Ensure only one is provided
    if (patient_id && temp_patient_id) {
      return res.status(400).json({ error: 'Cannot specify both patient_id and temp_patient_id' });
    }

    const newAppointment = await prisma.appointments.create({
      data: {
        patient_id: patient_id || null,
        temp_patient_id: temp_patient_id || null,
        dentist_id,
        date: new Date(date),
        time_from,
        time_to,
        fee,
        note,
        status: status || (temp_patient_id ? "pending" : "confirmed"), // Default temp patients to pending
        payment_status: payment_status || "not-paid",
        invoice_service: invoice_service ? parseInt(invoice_service) : null,
      },
      include: {
        patient: true,
        temp_patient: true
      }
    });

    // Send notifications based on patient type
    const patientInfo = newAppointment.patient || newAppointment.temp_patient;
    if (newAppointment.status === "confirmed" && patientInfo?.email && patientInfo?.phone_number) {
      sendAppointmentConfirmation(
        patientInfo.email,
        newAppointment.date,
        newAppointment.time_from
      );

      sendAppointmentConfirmationWhatsApp(
        patientInfo.phone_number,
        newAppointment.date,
        newAppointment.time_from
      );
    }

    //for the temp patients, sned email and the whatsapp notifications
    if (newAppointment.status === "pending" && patientInfo?.email && patientInfo?.phone_number) {
      sendtempAppointmentWhatsApp(
        patientInfo.phone_number,
        newAppointment.date,
        newAppointment.time_from
      );

      sendtempAppointmentWhatsApp(
        patientInfo.phone_number,
        newAppointment.date,
        newAppointment.time_from
      );
    }

    res.status(201).json(newAppointment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment status when a temp patient is converted to a regular patient
router.put('/update-temp-to-patient/:tempPatientId', authenticateToken, async (req, res) => {
  try {
    const { tempPatientId } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Update all appointments for this temp patient
    const updatedAppointments = await prisma.appointments.updateMany({
      where: {
        temp_patient_id: tempPatientId,
        status: { not: 'completed' } // Only update non-completed appointments
      },
      data: {
        status: status
      }
    });

    res.json({
      message: `Successfully updated ${updatedAppointments.count} appointments to status: ${status}`,
      count: updatedAppointments.count
    });
  } catch (error) {
    console.error('Error updating appointment status for temp patient:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

router.put('/:appointment_id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);

    const past = await prisma.appointments.findUnique({ where: { appointment_id: Number(req.params.appointment_id) } });

    // Update the appointment with the new data
    const updated = await prisma.appointments.update({
      where: { appointment_id: Number(req.params.appointment_id) },
      data,
    });

    // Fetch the updated appointment with related data
    const appointment = await prisma.appointments.findUnique({
      where: { appointment_id: Number(req.params.appointment_id) },
      include: {
        patient: true,
        dentist: true
      }
    });

    // Send appropriate email based on status change
    if (data.status === "cancelled") {
      // Get the dentist name for the cancellation email
      const dentist = await prisma.dentists.findUnique({
        where: { dentist_id: appointment.dentist_id }
      });

      if (appointment.patient?.email) {
        sendAppointmentCancelation(
          appointment.patient.email,
          appointment.date,
          appointment.time_from,
          dentist?.name || 'the dentist',
          data.cancel_note || null
        );
      }

      if (appointment.patient?.phone_number) {
        sendAppointmentCancellationWhatsApp(
          appointment.patient.phone_number,
          appointment.date,
          appointment.time_from,
          dentist?.name || 'the dentist',
          data.cancel_note || ''
        );
      }
    }
    else if (data.status === "confirmed") {
      sendAppointmentConfirmation(
        appointment.patient.email,
        appointment.date,
        appointment.time_from
      );

      sendAppointmentConfirmationWhatsApp(
        appointment.patient.phone_number,
        appointment.date,
        appointment.time_from
      );
    }
    else if (data.status === "rescheduled") {
      await prisma.appointments.update({
        where: { appointment_id: Number(req.params.appointment_id) },
        data: {
          status: "confirmed"
        }
      });
      if (appointment.patient?.email) {
        sendAppointmentRescheduleNotice(appointment.patient.email, past.date, past.time_from, appointment.dentist.name, data.date, data.time_from);
      }

      if (appointment.patient?.phone_number) {
        sendAppointmentRescheduleWhatsApp(appointment.patient.phone_number, past.date, past.time_from, appointment.dentist.name, data.date, data.time_from);
      }
    }

    res.status(202).json(updated);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({
      error: 'Failed to update appointment',
      details: err.message
    });
  }
});

router.delete('/:appointment_id', authenticateToken, async (req, res) => {
  try {
    await prisma.appointments.delete({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

router.get('/payment-summary/:patient_id', authenticateToken, async (req, res) => {
  try {
    const { patient_id } = req.params;

    // Get paid and unpaid appointments separately for better clarity
    const [paidAppointments, unpaidAppointments] = await Promise.all([
      // Get all paid appointments (where payment_status is 'completed')
      prisma.appointments.findMany({
        where: {
          patient_id,
          fee: { not: null },
          status: { not: 'cancelled' },
          OR: [
            { payment_status: 'paid' },
            { payment_status: 'Paid' }
          ]
        },
        select: { fee: true }
      }),
      // Get all unpaid appointments (where payment_status is not 'completed' or missing)
      prisma.appointments.findMany({
        where: {
          patient_id,
          fee: { not: null },
          status: { not: 'cancelled' },
          payment_status: {
            notIn: ['paid', 'Paid']
          }
        },
        select: { fee: true }
      })
    ]);

    // Calculate totals
    const totalPaid = paidAppointments.reduce(
      (sum, appt) => sum.plus(new Prisma.Decimal(appt.fee)),
      new Prisma.Decimal(0)
    );

    const totalUnpaid = unpaidAppointments.reduce(
      (sum, appt) => sum.plus(new Prisma.Decimal(appt.fee)),
      new Prisma.Decimal(0)
    );

    const totalDue = totalUnpaid;
    const total = parseInt(totalPaid) + parseInt(totalDue);
    res.json({
      success: true,
      data: {
        total_due: totalDue.toFixed(2),
        total_paid: totalPaid.toFixed(2),
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary',
      details: error.message
    });
  }
});

export default router;
