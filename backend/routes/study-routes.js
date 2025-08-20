import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMedicalImageAndReportAddedNotice, sendMedicalImageAddedNotice, sendMedicalReportAddedNotice } from '../utils/mailer.js';
import { sendMedicalImageAndReportAddedNoticeWhatsApp, sendMedicalImageAddedNoticeWhatsApp, sendMedicalReportAddedNoticeWhatsApp } from '../utils/whatsapp.js';
import { authenticateToken } from '../middleware/authentication.js';
import multer from 'multer';
import axios from 'axios';

const prisma = new PrismaClient();
const router = express.Router();

// Orthanc PACS configuration
const PACS_URL = process.env.PACS_URL || 'http://localhost:8042';
const PACS_USERNAME = process.env.PACS_USERNAME || 'orthanc';
const PACS_PASSWORD = process.env.PACS_PASSWORD || 'orthanc';
const dicomurlx = process.env.NEXT_PUBLIC_DICOM_URL || 'http://localhost:3000';

// Multer configuration - MEMORY ONLY (no disk storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for DICOM files/zips
  },
  fileFilter: (req, file, cb) => {
    // Accept DICOM files, ZIP files, and any files when uploading folders
    const isValidDicom = file.mimetype === 'application/dicom' || file.originalname.toLowerCase().endsWith('.dcm');
    const isValidZip = file.mimetype === 'application/zip' || file.originalname.toLowerCase().endsWith('.zip');
    const isValidFolder = true; // When uploading folders, accept any file type initially
    
    if (isValidDicom || isValidZip || isValidFolder) {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files, ZIP files, or folder uploads are allowed'), false);
    }
  }
});

// Orthanc API utility functions
const orthancAuth = {
  username: PACS_USERNAME,
  password: PACS_PASSWORD
};

// Helper function to upload multiple files (DICOM, ZIP, or folders) directly to Orthanc
const uploadFilesToOrthanc = async (files) => {
  try {
    const uploadResults = [];
    let firstStudyId = null;
    
    console.log(`Uploading ${files.length} files to PACS server...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file ${i + 1}/${files.length}: ${file.originalname || file.filename}`);
      
      try {
        const fileBuffer = file.buffer || file;
        const fileName = file.originalname || file.filename || `file_${i + 1}`;
        
        const response = await axios.post(
          `${PACS_URL}/instances`,
          fileBuffer,
          {
            auth: orthancAuth,
            headers: {
              'Content-Type': 'application/dicom',
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000 // 60 second timeout for large files
          }
        );
        const result = response.data;
        
        // Handle both single file upload (object) and ZIP/multiple file upload (array)
        if (Array.isArray(result)) {
          // ZIP file or multiple DICOM files - process each instance
          result.forEach((instance, index) => {
            uploadResults.push({
              filename: `${fileName}_instance_${index + 1}`,
              instanceId: instance.ID,
              studyId: instance.ParentStudy,
              seriesId: instance.ParentSeries,
              success: true,
              status: instance.Status
            });
            
            // Store the first study ID as the primary study ID
            if (!firstStudyId) {
              firstStudyId = instance.ParentStudy;
            }
          });
          console.log(`Successfully uploaded ${fileName} with ${result.length} instances. First Instance ID: ${result[0]?.ID}`);
        } else {
          // Single DICOM file
          uploadResults.push({
            filename: fileName,
            instanceId: result.ID,
            studyId: result.ParentStudy,
            seriesId: result.ParentSeries,
            success: true
          });
          
          // Store the first study ID as the primary study ID
          if (!firstStudyId) {
            firstStudyId = result.ParentStudy;
          }
          console.log(`Successfully uploaded ${fileName}. Instance ID: ${result.ID}`);
        }
      } catch (uploadError) {
        console.error(`Failed to upload ${file.originalname || file.filename}:`, uploadError.response?.data || uploadError.message);
        uploadResults.push({
          filename: file.originalname || file.filename || `file_${i + 1}`,
          success: false,
          error: uploadError.message
        });
      }
    }
    
    const successfulUploads = uploadResults.filter(r => r.success);
    const failedUploads = uploadResults.filter(r => !r.success);
    
    console.log(`Upload complete: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
    
    if (successfulUploads.length === 0) {
      throw new Error('Failed to upload any files to PACS server');
    }
    
    return {
      studyId: firstStudyId,
      instanceId: successfulUploads[0].instanceId, // Use first successful upload as primary instance
      uploadResults: uploadResults,
      totalFiles: files.length,
      successfulFiles: successfulUploads.length,
      failedFiles: failedUploads.length
    };
  } catch (error) {
    console.error('Error in uploadFilesToOrthanc:', error);
    throw new Error(`Failed to upload files to PACS server: ${error.message}`);
  }
};

// Helper function to upload DICOM DIRECTLY to Orthanc - currently not used 7-30
/*const uploadDicomToOrthanc = async (fileBuffer, filename) => {
  try {
    console.log(`Uploading ${filename} directly to PACS server...`);
    const response = await axios.post(
      `${PACS_URL}/instances`,
      fileBuffer,
      {
        auth: orthancAuth,
        headers: {
          'Content-Type': 'application/dicom',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30000 // 30 second timeout
      }
    );
    console.log(`Successfully uploaded ${filename} to PACS. Instance ID: ${response.data.ID}`);
    return response.data;
  } catch (error) {
    console.error('Error uploading DICOM to Orthanc:', error.response?.data || error.message);
    throw new Error(`Failed to upload DICOM to PACS server: ${error.message}`);
  }
};*/

// Helper function to validate PACS connectivity
const validatePacsConnection = async () => {
  try {
    await axios.get(`${PACS_URL}/system`, { 
      auth: orthancAuth,
      timeout: 5000 
    });
    return true;
  } catch (error) {
    console.error('PACS server not accessible:', error.message);
    return false;
  }
};

// Helper function to get study from Orthanc
const getStudyFromOrthanc = async (studyId) => {
  if (studyId === undefined || studyId === null) {
    console.error('Invalid study ID provided:', studyId);
    return null;
  }
  try {
    const response = await axios.get(
      `${PACS_URL}/studies/${studyId}`,
      { auth: orthancAuth }
    );
    console.log('Fetched study from Orthanc:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching study from Orthanc:', error.response?.data || error.message);
    return null;
  }
};

// Helper function to get instance preview from Orthanc
const getInstancePreview = async (instanceId, size = 512) => {
  try {
    const response = await axios.get(
      `${PACS_URL}/instances/${instanceId}/preview`,
      { 
        auth: orthancAuth,
        params: { size },
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting instance preview from Orthanc:', error.response?.data || error.message);
    return null;
  }
};

// Helper function to get DICOM file from Orthanc
const getDicomFile = async (instanceId) => {
  try {
    const response = await axios.get(
      `${PACS_URL}/instances/${instanceId}/file`,
      { 
        auth: orthancAuth,
        responseType: 'arraybuffer'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting DICOM file from Orthanc:', error.response?.data || error.message);
    return null;
  }
};

// Helper function to search studies in Orthanc
const searchStudiesInOrthanc = async (query = {}) => {
  try {
    const response = await axios.post(
      `${PACS_URL}/tools/find`,
      {
        Level: 'Study',
        Query: query,
        Expand: true
      },
      { auth: orthancAuth }
    );
    return response.data;
  } catch (error) {
    console.error('Error searching studies in Orthanc:', error.response?.data || error.message);
    return [];
  }
};

// Get all studies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studies = await prisma.study.findMany({
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      }
    });
    res.json(studies);
  } catch (error) {
    console.error('Error fetching studies:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
});

// Get a single study by ID
router.get('/:study_id', authenticateToken, async (req, res) => {
  try {
    const study = await prisma.study.findUnique({
      where: { study_id: parseInt(req.params.study_id) },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      }
    });

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json(study);
  } catch (error) {
    console.error('Error fetching study:', error);
    res.status(500).json({ error: 'Failed to fetch study' });
  }
});

// Get studies by radiologist ID
router.get('/radiologist/:radiologist_id', authenticateToken, async (req, res) => {
  try {
    const studies = await prisma.study.findMany({
      where: {
        radiologist_id: req.params.radiologist_id
      },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    res.json(studies);
  } catch (error) {
    console.error('Error fetching radiologist studies:', error);
    res.status(500).json({ error: 'Failed to fetch radiologist studies' });
  }
});

// Get studies by patient ID
router.get('/patient/:patient_id', authenticateToken, async (req, res) => {
  console.debug("route called");
  console.debug(req.params.patient_id);
  try {
    const studies = await prisma.study.findMany({
      where: { patient_id: req.params.patient_id },
      include: {
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });
    console.debug(studies);
    res.json(studies);
  } catch (error) {
    console.error('Error fetching patient studies:', error);
    res.status(500).json({ error: 'Failed to fetch patient studies' });
  }
});

// Get studies by dentist ID
router.get('/dentist/:dentist_id', authenticateToken, async (req, res) => {
  try {
    const studies = await prisma.study.findMany({
      where: {
        dentistAssigns: {
          some: {
            dentist_id: req.params.dentist_id
          }
        }
      },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    res.json(studies);
  } catch (error) {
    console.error('Error fetching dentist studies:', error);
    res.status(500).json({ error: 'Failed to fetch dentist studies' });
  }
});

// Create a new study (DICOM uploaded to PACS)
router.post('/', upload.any(), async (req, res) => {
  try {
    // Check PACS connectivity first
    const pacsConnected = await validatePacsConnection();
    if (!pacsConnected) {
      return res.status(503).json({ 
        error: 'PACS server is not accessible. Please try again later.' 
      });
    }

    const data = { ...req.body };
    console.debug('Incoming study payload:', data);
    console.debug('Uploaded files:', req.files);

    // Convert assertion_number from string to integer (FormData sends everything as strings)
    if (data.assertion_number) {
      data.assertion_number = parseInt(data.assertion_number);
    }

    data.isurgent = false;//is urgent is not used photonxr phase 1 so skip s

    // Handle DICOM file uploads (single files, multiple files, ZIP files, or folders)
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files...`);
      try {
        // Upload all files directly to PACS (Orthanc handles ZIP extraction automatically)
        const uploadResult = await uploadFilesToOrthanc(req.files);
        console.log(uploadResult);
        data.pacs_study_id = uploadResult.studyId;
        data.pacs_instance_id = uploadResult.instanceId;
        // Point directly to PACS server for file access
        data.dicom_file_url = `${PACS_URL}/instances/${uploadResult.instanceId}/file`;
        
        console.log(`Files uploaded successfully to PACS. Study ID: ${uploadResult.studyId}`);
        console.log(`Upload summary: ${uploadResult.successfulFiles}/${uploadResult.totalFiles} files successful`);
        
      } catch (pacsError) {
        console.error('Failed to upload to PACS:', pacsError);
        return res.status(500).json({ 
          error: 'Failed to upload files to PACS server', 
          details: pacsError.message 
        });
      }
    }

    const newStudy = await prisma.study.create({
      data,
      include: {
        patient: true,
        radiologist: true,
        report: true
      }
    });

    // Send notifications
    const patientEmail = newStudy?.patient?.email;
    const patientPhone = newStudy?.patient?.phone_number;
    const patientName = newStudy?.patient?.name;
    const studyDetails = await getStudyFromOrthanc(newStudy?.pacs_study_id); 
    const url = `${dicomurlx}/viewer/dicomweb?StudyInstanceUIDs=${studyDetails.MainDicomTags?.StudyInstanceUID}`;
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    if (patientEmail && patientName) {
      try {
        const hasReport = newStudy.report?.report_file_url;
        const hasImage = !!newStudy.pacs_instance_id;

        if (hasReport && hasImage) {
          await sendMedicalImageAndReportAddedNotice(patientEmail, formattedDate, patientName, url);
          if (patientPhone) {
            await sendMedicalImageAndReportAddedNoticeWhatsApp(patientPhone, formattedDate, patientName);
          }
        } else if (!hasReport && hasImage) {
          await sendMedicalImageAddedNotice(patientEmail, formattedDate, patientName, url);
          if (patientPhone) {
            await sendMedicalImageAddedNoticeWhatsApp(patientPhone, formattedDate, patientName);
          }
        } else if (hasReport && !hasImage) {
          await sendMedicalReportAddedNotice(patientEmail, formattedDate, patientName);
          if (patientPhone) {
            await sendMedicalReportAddedNoticeWhatsApp(patientPhone, formattedDate, patientName);
          }
        }
      } catch (emailErr) {
        console.error('Failed to send email notice:', emailErr);
      }
    }

    res.status(201).json({
      ...newStudy,
      upload_info: req.files && req.files.length > 0 ? {
        message: 'Files uploaded directly to PACS server (not stored on backend)',
        pacs_storage: true,
        backend_storage: false,
        upload_type: req.files.some(f => f.originalname.endsWith('.zip')) ? 'includes_zip' : 
                     req.files.length > 1 ? 'multiple_files' : 'single_file',
        total_files: req.files.length
      } : null
    });
  } catch (error) {
    console.error('Error creating study:', error);
    res.status(500).json({ error: 'Failed to create study', details: error.message });
  }
});

// Update a study (DICOM replacement uploaded ONLY to PACS)
router.put('/:study_id', upload.any(), async (req, res) => {
  try {
    const studyId = parseInt(req.params.study_id);
    console.debug("PUT method called");
    console.debug(req.body);

    // Check PACS connectivity if files are being uploaded
    if (req.files && req.files.length > 0) {
      const pacsConnected = await validatePacsConnection();
      if (!pacsConnected) {
        return res.status(503).json({ 
          error: 'PACS server is not accessible. Cannot upload files.' 
        });
      }
    }

    const { radiologist_id, doctor_ids, ...rest } = req.body;
    const updateData = { ...rest };

    // Convert assertion_number from string to integer (FormData sends everything as strings)
    if (updateData.assertion_number) {
      updateData.assertion_number = parseInt(updateData.assertion_number);
    }

    // If new files are provided, upload DIRECTLY to PACS (replace existing)
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} replacement files to PACS `);
      try {
        // Upload all files directly to PACS (Orthanc handles ZIP extraction automatically)
        const uploadResult = await uploadFilesToOrthanc(req.files);
        
        updateData.pacs_study_id = uploadResult.studyId;
        updateData.pacs_instance_id = uploadResult.instanceId;
        updateData.dicom_file_url = `${PACS_URL}/instances/${uploadResult.instanceId}/file`;
        
        console.log(`Replacement files uploaded successfully to PACS. Study ID: ${uploadResult.studyId}`);
        console.log(`Upload summary: ${uploadResult.successfulFiles}/${uploadResult.totalFiles} files successful`);
        
      } catch (pacsError) {
        console.error('Failed to upload replacement files to PACS:', pacsError);
        return res.status(500).json({ 
          error: 'Failed to upload replacement files to PACS server', 
          details: pacsError.message 
        });
      }
    }

    if (radiologist_id !== undefined) {
      updateData.radiologist = radiologist_id ? {
        connect: { radiologist_id }
      } : { disconnect: true };
    }

    if (Array.isArray(doctor_ids)) {
      updateData.dentistAssigns = doctor_ids.length === 0
        ? { deleteMany: {} }
        : {
          deleteMany: {},
          create: doctor_ids.map((dentistId) => ({
            dentist: { connect: { dentist_id: dentistId.toString() } }
          }))
        };
    }

    const updatedStudy = await prisma.study.update({
      where: { study_id: studyId },
      data: updateData,
      include: {
        radiologist: true,
        dentistAssigns: { include: { dentist: true } },
        patient: true,
        report: true
      }
    });

    // Send notifications
    const hasImage = !!updatedStudy.pacs_instance_id;
    console.debug("Study details:", updatedStudy);
    const studyDetails = await getStudyFromOrthanc(updatedStudy?.pacs_study_id);
    console.log(studyDetails); 
    const url = `${dicomurlx}/viewer/dicomweb?StudyInstanceUIDs=${studyDetails.MainDicomTags?.StudyInstanceUID}`;
    if (updatedStudy.patient?.email) {
      try {
        const formattedDate = new Date(updatedStudy.date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        if (updatedStudy.report?.report_file_url && hasImage) {
          await sendMedicalImageAndReportAddedNotice(updatedStudy.patient.email, formattedDate, updatedStudy.patient.name, url);
        } else if (!updatedStudy.report?.report_file_url && hasImage) {
          await sendMedicalImageAddedNotice(updatedStudy.patient.email, formattedDate, updatedStudy.patient.name, url);
        } else if (updatedStudy.report?.report_file_url && !hasImage) {
          await sendMedicalReportAddedNotice(updatedStudy.patient.email, formattedDate, updatedStudy.patient.name);
        }
      } catch (err) {
        console.error('Error sending email:', err);
      }
    }

    console.debug("Updated successfully");
    res.json({
      ...updatedStudy,
      upload_info: req.files && req.files.length > 0 ? {
        message: 'Files uploaded directly to PACS server',
        pacs_storage: true,
        backend_storage: false,
        upload_type: req.files.some(f => f.originalname.endsWith('.zip')) ? 'includes_zip' : 
                     req.files.length > 1 ? 'multiple_files' : 'single_file',
        total_files: req.files.length
      } : null
    });
  } catch (error) {
    console.error('Error updating study:', error);
    res.status(500).json({ error: 'Failed to update study', details: error.message });
  }
});

// Delete a study
router.delete('/:study_id', authenticateToken, async (req, res) => {
  try {
    const studyId = parseInt(req.params.study_id);

    // Check if study exists
    const existingStudy = await prisma.study.findUnique({
      where: { study_id: studyId }
    });

    if (!existingStudy) {
      return res.status(404).json({ error: 'Study not found' });
    }

    // Optional: Delete from PACS as well
    if (existingStudy.pacs_study_id) {
      try {
        await axios.delete(
          `${PACS_URL}/studies/${existingStudy.pacs_study_id}`,
          { auth: orthancAuth }
        );
        console.log('Study deleted from PACS server');
      } catch (pacsError) {
        console.warn('Failed to delete from PACS (continuing with database deletion):', pacsError.message);
      }
    }

    await prisma.study.delete({
      where: { study_id: studyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting study:', error);
    res.status(500).json({ error: 'Failed to delete study', details: error.message });
  }
});

// Get count of today's studies
router.get('/today/count', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();

    const startUtc = new Date(Date.UTC(year, month, day));
    const endUtc = new Date(Date.UTC(year, month, day + 1));

    const count = await prisma.study.count({
      where: {
        date: {
          gte: startUtc,
          lt: endUtc
        }
      }
    });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching today's study count:", error);
    res.status(500).json({ error: "Failed to fetch today's study count", details: error.message });
  }
});

// Get total number of studies
router.get('/total/count', async (req, res) => {
  try {
    const count = await prisma.study.count();
    res.json(count);
  } catch (error) {
    console.error('Error fetching total study count:', error);
    res.status(500).json({ error: 'Failed to fetch total study count', details: error.message });
  }
});

// Search studies by patient name or ID (filtered by radiologist)
router.get('/search/radiologist/:radiologist_id', authenticateToken, async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const radiologistId = req.params.radiologist_id;

    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const studies = await prisma.study.findMany({
      where: {
        radiologist_id: radiologistId,
        OR: [
          {
            patient_id: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            patient: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      take: 10
    });

    res.json(studies);
  } catch (error) {
    console.error('Error searching radiologist studies:', error);
    res.status(500).json({ error: 'Failed to search radiologist studies' });
  }
});

// === PACS-ONLY ROUTES (No Backend File Storage) ===

// Upload files DIRECTLY to PACS only (supports single files, multiple files, ZIP files, and folders)
router.post('/upload-dicom', upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Check PACS connectivity
    const pacsConnected = await validatePacsConnection();
    if (!pacsConnected) {
      return res.status(503).json({ 
        error: 'PACS server is not accessible. Please try again later.' 
      });
    }

    console.log(`Processing ${req.files.length} uploaded files...`);
    
    // Upload all files directly to PACS (Orthanc handles ZIP extraction automatically)
    const uploadResult = await uploadFilesToOrthanc(req.files);
    
    // Get detailed study information from PACS
    const studyDetails = await getStudyFromOrthanc(uploadResult.studyId);
    
    if (!studyDetails) {
      return res.status(500).json({ error: 'Failed to retrieve study details from PACS' });
    }

    res.status(201).json({
      message: 'Files uploaded successfully to PACS only (not stored on backend)',
      pacs_study_id: uploadResult.studyId,
      pacs_instance_id: uploadResult.instanceId,
      study_details: studyDetails,
      dicom_file_url: `${PACS_URL}/instances/${uploadResult.instanceId}/file`,
      upload_summary: {
        total_files_uploaded: req.files.length,
        successful_uploads: uploadResult.successfulFiles,
        failed_uploads: uploadResult.failedFiles,
        upload_results: uploadResult.uploadResults
      },
      storage_info: {
        pacs_storage: true,
        backend_storage: false,
        upload_type: req.files.some(f => f.originalname.endsWith('.zip')) ? 'includes_zip' : 
                     req.files.length > 1 ? 'multiple_files' : 'single_file'
      }
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files to PACS', details: error.message });
  }
});

// Get DICOM instance preview image from PACS
router.get('/dicom/:instance_id/preview', authenticateToken, async (req, res) => {
  try {
    const { instance_id } = req.params;
    const size = req.query.size || 512;
    
    const previewBuffer = await getInstancePreview(instance_id, size);
    
    if (!previewBuffer) {
      return res.status(404).json({ error: 'Instance not found or preview not available' });
    }
    
    res.set('Content-Type', 'image/png');
    res.send(previewBuffer);
  } catch (error) {
    console.error('Error getting DICOM preview:', error);
    res.status(500).json({ error: 'Failed to get DICOM preview' });
  }
});

// Download DICOM file directly from PACS
router.get('/dicom/:instance_id/download', authenticateToken, async (req, res) => {
  try {
    const { instance_id } = req.params;
    
    const dicomBuffer = await getDicomFile(instance_id);
    
    if (!dicomBuffer) {
      return res.status(404).json({ error: 'DICOM file not found' });
    }
    
    res.set({
      'Content-Type': 'application/dicom',
      'Content-Disposition': `attachment; filename="${instance_id}.dcm"`
    });
    res.send(dicomBuffer);
  } catch (error) {
    console.error('Error downloading DICOM file:', error);
    res.status(500).json({ error: 'Failed to download DICOM file' });
  }
});

// Search studies in PACS
router.post('/pacs/search', authenticateToken, async (req, res) => {
  try {
    const { PatientID, PatientName, StudyDate, StudyDescription } = req.body;
    
    const query = {};
    if (PatientID) query.PatientID = PatientID;
    if (PatientName) query.PatientName = PatientName;
    if (StudyDate) query.StudyDate = StudyDate;
    if (StudyDescription) query.StudyDescription = StudyDescription;
    
    const pacsStudies = await searchStudiesInOrthanc(query);
    
    res.json({
      total: pacsStudies.length,
      studies: pacsStudies
    });
  } catch (error) {
    console.error('Error searching PACS studies:', error);
    res.status(500).json({ error: 'Failed to search PACS studies' });
  }
});

// Get study details from PACS
router.get('/pacs/studies/:study_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const { study_id } = req.params;
    
    const studyDetails = await getStudyFromOrthanc(study_id);
    
    if (!studyDetails) {
      return res.status(404).json({ error: 'Study not found in PACS' });
    }
    
    res.json(studyDetails);
  } catch (error) {
    console.error('Error getting PACS study details:', error);
    res.status(500).json({ error: 'Failed to get study details from PACS' });
  }
});

// Get PACS server status
router.get('/pacs/status', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PACS_URL}/system`, { auth: orthancAuth });
    res.json({
      status: 'connected',
      pacs_url: PACS_URL,
      server_info: response.data,
      storage_info: {
        backend_file_storage: false,
        pacs_only_storage: true
      }
    });
  } catch (error) {
    console.error('Error checking PACS status:', error);
    res.status(500).json({ 
      status: 'disconnected',
      pacs_url: PACS_URL,
      error: 'Failed to connect to PACS server' 
    });
  }
});

// Sync database studies with PACS
router.post('/pacs/sync', authenticateToken, async (req, res) => {
  try {
    const dbStudies = await prisma.study.findMany({
      where: {
        pacs_study_id: {
          not: null
        }
      },
      include: {
        patient: true
      }
    });

    const syncResults = [];
    
    for (const study of dbStudies) {
      try {
        const pacsStudy = await getStudyFromOrthanc(study.pacs_study_id);
        if (pacsStudy) {
          syncResults.push({
            study_id: study.study_id,
            pacs_study_id: study.pacs_study_id,
            status: 'found_in_pacs',
            instances_count: pacsStudy.Instances?.length || 0
          });
        } else {
          syncResults.push({
            study_id: study.study_id,
            pacs_study_id: study.pacs_study_id,
            status: 'not_found_in_pacs'
          });
        }
      } catch (error) {
        syncResults.push({
          study_id: study.study_id,
          pacs_study_id: study.pacs_study_id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      total_studies: dbStudies.length,
      sync_results: syncResults,
      storage_info: {
        message: 'All DICOM files are stored in PACS only, not on backend server'
      }
    });
  } catch (error) {
    console.error('Error syncing with PACS:', error);
    res.status(500).json({ error: 'Failed to sync with PACS' });
  }
});

// Get study information from PACS using instance ID
router.get('/dicom/:instance_id/study-info', authenticateToken, async (req, res) => {
  try {
    const { instance_id } = req.params;
    
    // Get instance details from Orthanc
    const instanceResponse = await axios.get(
      `${PACS_URL}/instances/${instance_id}`,
      { auth: orthancAuth }
    );
    
    if (!instanceResponse.data) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    
    const instanceData = instanceResponse.data;
    const studyId = instanceData.ParentStudy;
    
    // Get study details from Orthanc
    const studyResponse = await axios.get(
      `${PACS_URL}/studies/${studyId}`,
      { auth: orthancAuth }
    );
    
    if (!studyResponse.data) {
      return res.status(404).json({ error: 'Study not found' });
    }
    
    const studyData = studyResponse.data;
    
    // Get DICOM tags for study information
    const tagsResponse = await axios.get(
      `${PACS_URL}/studies/${studyId}/shared-tags?simplify`,
      { auth: orthancAuth }
    );
    
    const tags = tagsResponse.data || {};
    
    res.json({
      StudyInstanceUID: tags.StudyInstanceUID || studyId,
      StudyID: tags.StudyID || '',
      StudyDescription: tags.StudyDescription || '',
      PatientName: tags.PatientName || '',
      PatientID: tags.PatientID || '',
      StudyDate: tags.StudyDate || '',
      StudyTime: tags.StudyTime || '',
      Modality: tags.Modality || '',
      AccessionNumber: tags.AccessionNumber || '',
      InstanceCount: studyData.Instances?.length || 0,
      SeriesCount: studyData.Series?.length || 0,
      pacs_study_id: studyId,
      pacs_instance_id: instance_id,
      pacs_url: PACS_URL
    });
  } catch (error) {
    console.error('Error getting study info from PACS:', error);
    res.status(500).json({ 
      error: 'Failed to get study information from PACS',
      details: error.response?.data || error.message 
    });
  }
});

export default router;