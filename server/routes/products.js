const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts
} = require('../controllers/productController');
const { auth, requireRole } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', getProducts);
router.get('/seller', auth, requireRole(['seller']), getSellerProducts);
router.get('/:id', getProductById);
router.post('/', auth, requireRole(['seller']), upload.single('image'), createProduct);
router.put('/:id', auth, requireRole(['seller', 'admin']), upload.single('image'), updateProduct);
router.delete('/:id', auth, requireRole(['seller', 'admin']), deleteProduct);

module.exports = router;