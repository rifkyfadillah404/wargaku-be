-- Membuat database data_masyarakat
CREATE DATABASE IF NOT EXISTS data_masyarakat;
USE data_masyarakat;

-- Membuat tabel masyarakat
CREATE TABLE IF NOT EXISTS masyarakat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(16) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  tempat_lahir VARCHAR(50) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
  alamat TEXT NOT NULL,
  rt VARCHAR(3) NOT NULL,
  rw VARCHAR(3) NOT NULL,
  kelurahan VARCHAR(50) NOT NULL,
  kecamatan VARCHAR(50) NOT NULL,
  agama VARCHAR(20) NOT NULL,
  status_perkawinan VARCHAR(20) NOT NULL,
  pekerjaan VARCHAR(50) NOT NULL,
  kewarganegaraan VARCHAR(20) NOT NULL DEFAULT 'WNI',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Membuat index untuk pencarian yang lebih cepat
CREATE INDEX idx_nik ON masyarakat(nik);
CREATE INDEX idx_nama ON masyarakat(nama);
CREATE INDEX idx_kelurahan ON masyarakat(kelurahan);
CREATE INDEX idx_kecamatan ON masyarakat(kecamatan);

-- Insert data sample untuk testing
INSERT INTO masyarakat (
  nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, 
  kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan
) VALUES 
(
  '3201234567890001', 
  'Ahmad Rizki Pratama', 
  'Jakarta', 
  '1990-05-15', 
  'Laki-laki', 
  'Jl. Merdeka No. 123', 
  '001', 
  '005', 
  'Kebon Jeruk', 
  'Kebon Jeruk', 
  'Islam', 
  'Belum Kawin', 
  'Programmer', 
  'WNI'
),
(
  '3201234567890002', 
  'Siti Nurhaliza', 
  'Bandung', 
  '1985-08-22', 
  'Perempuan', 
  'Jl. Sudirman No. 456', 
  '002', 
  '003', 
  'Menteng', 
  'Menteng', 
  'Islam', 
  'Kawin', 
  'Guru', 
  'WNI'
),
(
  '3201234567890003', 
  'Budi Santoso', 
  'Surabaya', 
  '1992-12-10', 
  'Laki-laki', 
  'Jl. Gatot Subroto No. 789', 
  '003', 
  '007', 
  'Tanah Abang', 
  'Tanah Abang', 
  'Kristen', 
  'Belum Kawin', 
  'Dokter', 
  'WNI'
),
(
  '3201234567890004', 
  'Maya Sari Dewi', 
  'Medan', 
  '1988-03-18', 
  'Perempuan', 
  'Jl. Thamrin No. 321', 
  '004', 
  '002', 
  'Gambir', 
  'Gambir', 
  'Hindu', 
  'Kawin', 
  'Pengusaha', 
  'WNI'
),
(
  '3201234567890005', 
  'Andi Wijaya', 
  'Makassar', 
  '1995-07-25', 
  'Laki-laki', 
  'Jl. Kuningan No. 654', 
  '005', 
  '001', 
  'Setiabudi', 
  'Setiabudi', 
  'Islam', 
  'Belum Kawin', 
  'Mahasiswa', 
  'WNI'
);
