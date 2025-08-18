import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { sendReminder } from './../utils/mailer.js';
import { sendReminderWhatsApp } from './../utils/whatsapp.js';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { sendAppointmentOverdueNotice } from './../utils/mailer.js';

const prisma = new PrismaClient();

cron.schedule('0 20 * * *', async () => {
  try {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const start = startOfDay(tomorrow);
    const end = endOfDay(tomorrow);

    const appointments = await prisma.appointments.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        }
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    for (const appointment of appointments) {
      if (appointment.patient?.email && appointment.dentist?.name) {
        await sendReminder(
          appointment.patient.email,
          appointment.date.toISOString().split('T')[0],
          appointment.time_from,
          appointment.dentist.name
        );

        await sendReminderWhatsApp(
          appointment.patient.phone,
          appointment.date.toISOString().split('T')[0],
          appointment.time_from,
          appointment.dentist.name
        );
        console.log(`Reminder sent to ${appointment.patient.phone}`);
        console.log(`Reminder sent to ${appointment.patient.email}`);
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}, {
  timezone: 'Asia/Colombo'
});

cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Format to HH:mm string for time_from comparison
    const pad = (num) => num.toString().padStart(2, '0');
    const hours = pad(fifteenMinutesAgo.getHours());
    const minutes = pad(fifteenMinutesAgo.getMinutes());
    const fifteenMinutesAgoStr = `${hours}:${minutes}`;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const overdueAppointments = await prisma.appointments.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        time_from: {
          lt: fifteenMinutesAgoStr,  // use string here
        },
        status: {
          notIn: ['checkedin', 'overdue'],
        },
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    if (overdueAppointments.length === 0) {
      return;
    }

    // Update statuses
    const updatePromises = overdueAppointments.map((appt) =>
      prisma.appointments.update({
        where: { appointment_id: appt.appointment_id },
        data: { status: 'overdue' },
      })
    );
    await Promise.all(updatePromises);

    const receptionists = await prisma.receptionists.findMany();

    for (const receptionist of receptionists) {
      await sendAppointmentOverdueNotice(receptionist.email, receptionist.name, overdueAppointments);
    }

    console.log(`[Cron] Marked and notified about ${overdueAppointments.length} overdue appointment(s).`);
  } catch (err) {
    console.error('Cron job error:', err);
  }
});