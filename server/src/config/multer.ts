import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/apierror';

// Create upload directories
const uploadsDir = path.join(process.cwd(), 'uploads');
const profilePicsDir = path.join(uploadsDir, 'profile-pics');
const gigImagesDir = path.join(uploadsDir, 'gig-images');
const attachmentsDir = path.join(uploadsDir, 'attachments');

[uploadsDir, profilePicsDir, gigImagesDir, attachmentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    if (file.fieldname === 'profilePicture') {
      uploadPath = profilePicsDir;
    } else if (file.fieldname === 'gigImages') {
      uploadPath = gigImagesDir;
    } else if (file.fieldname === 'attachments') {
      uploadPath = attachmentsDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const documentTypes = /pdf|doc|docx|txt/;
  
  const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = imageTypes.test(file.mimetype);
  
  if (file.fieldname === 'profilePicture' || file.fieldname === 'gigImages') {
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new ApiError(400, 'Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  } else if (file.fieldname === 'attachments') {
    const docExtname = documentTypes.test(path.extname(file.originalname).toLowerCase());
    const docMimetype = documentTypes.test(file.mimetype);
    
    if ((mimetype && extname) || (docMimetype && docExtname)) {
      return cb(null, true);
    } else {
      return cb(new ApiError(400, 'Only image and document files are allowed for attachments'));
    }
  }
  
  cb(new ApiError(400, 'Invalid file field'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10
  },
  fileFilter: fileFilter
});

export const uploadProfilePicture = upload.single('profilePicture');
export const uploadGigImages = upload.array('gigImages', 5);
export const uploadAttachments = upload.array('attachments', 3);

export const uploadMultiple = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'gigImages', maxCount: 5 },
  { name: 'attachments', maxCount: 3 }
]);

export default upload;