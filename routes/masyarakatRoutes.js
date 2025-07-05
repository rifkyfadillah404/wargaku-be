const express = require('express');
const router = express.Router();
const {
  getAllMasyarakat,
  getMasyarakatById,
  createMasyarakat,
  updateMasyarakat,
  deleteMasyarakat,
  searchMasyarakat
} = require('../controllers/masyarakatController');

// Route untuk mendapatkan semua data masyarakat
router.get('/', getAllMasyarakat);

// Route untuk pencarian data masyarakat
router.get('/search', searchMasyarakat);

// Route untuk mendapatkan data masyarakat berdasarkan ID
router.get('/:id', getMasyarakatById);

// Route untuk menambah data masyarakat baru
router.post('/', createMasyarakat);

// Route untuk mengupdate data masyarakat
router.put('/:id', updateMasyarakat);

// Route untuk menghapus data masyarakat
router.delete('/:id', deleteMasyarakat);

module.exports = router;
