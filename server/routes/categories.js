const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPrivilege
} = require('../controllers/categoryController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/:id/privilege', getCategoryPrivilege);
router.post('/', auth, requireRole(['admin']), createCategory);
router.put('/:id', auth, requireRole(['admin']), updateCategory);
router.delete('/:id', auth, requireRole(['admin']), deleteCategory);

module.exports = router;