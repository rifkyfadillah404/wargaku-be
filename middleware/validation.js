// Middleware untuk validasi data masyarakat
const validateMasyarakat = (req, res, next) => {
  const { nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan } = req.body;
  
  // Validasi field yang wajib diisi
  const requiredFields = {
    nik: 'NIK',
    nama: 'Nama',
    tempat_lahir: 'Tempat Lahir',
    tanggal_lahir: 'Tanggal Lahir',
    jenis_kelamin: 'Jenis Kelamin',
    alamat: 'Alamat',
    rt: 'RT',
    rw: 'RW',
    kelurahan: 'Kelurahan',
    kecamatan: 'Kecamatan',
    agama: 'Agama',
    status_perkawinan: 'Status Perkawinan',
    pekerjaan: 'Pekerjaan',
    kewarganegaraan: 'Kewarganegaraan'
  };
  
  const missingFields = [];
  
  for (const [field, label] of Object.entries(requiredFields)) {
    if (!req.body[field] || req.body[field].toString().trim() === '') {
      missingFields.push(label);
    }
  }
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Field berikut wajib diisi: ${missingFields.join(', ')}`
    });
  }
  
  // Validasi format NIK (16 digit)
  if (!/^\d{16}$/.test(nik)) {
    return res.status(400).json({
      success: false,
      message: 'NIK harus berupa 16 digit angka'
    });
  }
  
  // Validasi jenis kelamin
  if (!['Laki-laki', 'Perempuan'].includes(jenis_kelamin)) {
    return res.status(400).json({
      success: false,
      message: 'Jenis kelamin harus "Laki-laki" atau "Perempuan"'
    });
  }
  
  // Validasi format tanggal lahir (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal_lahir)) {
    return res.status(400).json({
      success: false,
      message: 'Format tanggal lahir harus YYYY-MM-DD'
    });
  }
  
  // Validasi RT dan RW (harus angka)
  if (!/^\d+$/.test(rt) || !/^\d+$/.test(rw)) {
    return res.status(400).json({
      success: false,
      message: 'RT dan RW harus berupa angka'
    });
  }
  
  next();
};

// Middleware untuk error handling
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
};

// Middleware untuk handle route yang tidak ditemukan
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan'
  });
};

module.exports = {
  validateMasyarakat,
  errorHandler,
  notFound
};
