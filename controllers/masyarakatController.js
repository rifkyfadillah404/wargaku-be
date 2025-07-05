const Masyarakat = require('../models/Masyarakat');

// Mendapatkan semua data masyarakat
const getAllMasyarakat = async (req, res) => {
  try {
    const data = await Masyarakat.getAll();
    res.status(200).json({
      success: true,
      message: 'Data masyarakat berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Error getting all masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data masyarakat',
      error: error.message
    });
  }
};

// Mendapatkan data masyarakat berdasarkan ID
const getMasyarakatById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Masyarakat.getById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data masyarakat tidak ditemukan'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Data masyarakat berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Error getting masyarakat by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data masyarakat',
      error: error.message
    });
  }
};

// Menambah data masyarakat baru
const createMasyarakat = async (req, res) => {
  try {
    const data = req.body;
    
    // Validasi NIK unik
    const existingData = await Masyarakat.getByNIK(data.nik);
    if (existingData) {
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar'
      });
    }
    
    const insertId = await Masyarakat.create(data);
    const newData = await Masyarakat.getById(insertId);
    
    res.status(201).json({
      success: true,
      message: 'Data masyarakat berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Error creating masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data masyarakat',
      error: error.message
    });
  }
};

// Mengupdate data masyarakat
const updateMasyarakat = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Cek apakah data exists
    const existingData = await Masyarakat.getById(id);
    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: 'Data masyarakat tidak ditemukan'
      });
    }
    
    // Validasi NIK unik (kecuali untuk data yang sama)
    const nikExists = await Masyarakat.getByNIK(data.nik);
    if (nikExists && nikExists.id != id) {
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar'
      });
    }
    
    const affectedRows = await Masyarakat.update(id, data);
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data masyarakat tidak ditemukan'
      });
    }
    
    const updatedData = await Masyarakat.getById(id);
    
    res.status(200).json({
      success: true,
      message: 'Data masyarakat berhasil diupdate',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate data masyarakat',
      error: error.message
    });
  }
};

// Menghapus data masyarakat
const deleteMasyarakat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah data exists
    const existingData = await Masyarakat.getById(id);
    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: 'Data masyarakat tidak ditemukan'
      });
    }
    
    const affectedRows = await Masyarakat.delete(id);
    
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data masyarakat tidak ditemukan'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Data masyarakat berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data masyarakat',
      error: error.message
    });
  }
};

// Mencari data masyarakat
const searchMasyarakat = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword pencarian diperlukan'
      });
    }
    
    const data = await Masyarakat.search(keyword);
    
    res.status(200).json({
      success: true,
      message: 'Pencarian berhasil',
      data: data
    });
  } catch (error) {
    console.error('Error searching masyarakat:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan pencarian',
      error: error.message
    });
  }
};

module.exports = {
  getAllMasyarakat,
  getMasyarakatById,
  createMasyarakat,
  updateMasyarakat,
  deleteMasyarakat,
  searchMasyarakat
};
