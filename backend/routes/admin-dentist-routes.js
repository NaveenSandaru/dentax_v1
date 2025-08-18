import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Get the dentist profile for admin
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Since there's only one dentist, we can just get the first one
    const dentist = await prisma.dentists.findFirst();
    
    if (!dentist) {
      return res.status(404).json({ error: 'Dentist profile not found' });
    }
    
    res.json(dentist);
  } catch (error) {
    console.error('Error fetching dentist profile:', error);
    res.status(500).json({ error: 'Failed to fetch dentist profile' });
  }
});

// Create or update dentist profile with file upload
router.post('/profile', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone_number,
      language,
      service_types,
      dentist_name,
      clinic_address,
      appointment_fee,
      appointment_duration,
      work_days_from,
      work_days_to,
      work_time_from,
      work_time_to
    } = req.body;
    
    let profilePicturePath = null;
    
    // If a new file was uploaded
    if (req.file) {
      // Construct the URL path where the file can be accessed
      profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      
      // If there was a previous profile picture, delete it
      if (req.body.existingProfilePicture) {
        const oldFilePath = path.join(process.cwd(), req.body.existingProfilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    } else if (req.body.existingProfilePicture) {
      // Keep the existing profile picture if no new one was uploaded
      profilePicturePath = req.body.existingProfilePicture;
    }

    // Check if a dentist already exists
    let dentist = await prisma.dentists.findFirst();

    if (dentist) {
      // Update existing dentist
      dentist = await prisma.dentists.update({
        where: { dentist_id: dentist.dentist_id },
        data: {
          name,
          email,
          phone_number,
          language: language || null,
          service_types: service_types || null,
          dentist_name: dentist_name || null,
          clinic_address: clinic_address || null,
          appointment_fee: appointment_fee ? parseFloat(appointment_fee) : null,
          appointment_duration: appointment_duration || null,
          work_days_from: work_days_from || null,
          work_days_to: work_days_to || null,
          work_time_from: work_time_from || null,
          work_time_to: work_time_to || null,
          profile_picture: profilePicturePath || null
        }
      });
    } else {
      // Create new dentist
      dentist = await prisma.dentists.create({
        data: {
          dentist_id: 'knrsdent001', // Fixed ID since there's only one dentist
          name,
          email,
          phone_number,
          language: language || null,
          service_types: service_types || null,
          dentist_name: dentist_name || null,
          clinic_address: clinic_address || null,
          appointment_fee: appointment_fee ? parseFloat(appointment_fee) : null,
          appointment_duration: appointment_duration || '30',
          work_days_from: work_days_from || 'Monday',
          work_days_to: work_days_to || 'Friday',
          work_time_from: work_time_from || '09:00',
          work_time_to: work_time_to || '17:00',
          profile_picture: profilePicturePath || null
        }
      });
    }

    res.json(dentist);
  } catch (error) {
    console.error('Error saving dentist profile:', error);
    res.status(500).json({ error: 'Failed to save dentist profile' });
  }
});

export default router;
