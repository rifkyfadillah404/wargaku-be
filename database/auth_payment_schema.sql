-- Tambahan tabel untuk authentication dan payment system
USE data_masyarakat;

-- Tabel users untuk authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  masyarakat_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (masyarakat_id) REFERENCES masyarakat(id) ON DELETE SET NULL
);

-- Tabel payment_types untuk jenis pembayaran
CREATE TABLE IF NOT EXISTS payment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_monthly BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel payments untuk pembayaran
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  masyarakat_id INT NOT NULL,
  payment_type_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  payment_date TIMESTAMP NULL,
  proof_image VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  notes TEXT NULL,
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (masyarakat_id) REFERENCES masyarakat(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_payment (masyarakat_id, payment_type_id, payment_month)
);

-- Tabel sessions untuk manage login sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_masyarakat ON payments(masyarakat_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_month ON payments(payment_month);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Insert default payment types
INSERT IGNORE INTO payment_types (name, description, amount, is_monthly) VALUES 
('Iuran Bulanan RT', 'Iuran wajib bulanan untuk kegiatan RT', 50000.00, TRUE),
('Iuran Keamanan', 'Iuran untuk biaya keamanan lingkungan', 25000.00, TRUE),
('Iuran Kebersihan', 'Iuran untuk biaya kebersihan dan sampah', 30000.00, TRUE),
('Iuran Sosial', 'Iuran untuk kegiatan sosial dan kemasyarakatan', 20000.00, TRUE);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password, role) VALUES 
('admin', 'admin@datamasyarakat.com', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu7VqQZQXQXQXQXQXQXQXQXQXQXQXQXQXQ', 'admin');

-- Insert sample user accounts linked to masyarakat
INSERT IGNORE INTO users (username, email, password, role, masyarakat_id) VALUES 
('ahmad.rizki', 'ahmad.rizki@email.com', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu7VqQZQXQXQXQXQXQXQXQXQXQXQXQXQXQ', 'user', 1),
('siti.nurhaliza', 'siti.nurhaliza@email.com', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu7VqQZQXQXQXQXQXQXQXQXQXQXQXQXQXQ', 'user', 2),
('budi.santoso', 'budi.santoso@email.com', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu7VqQZQXQXQXQXQXQXQXQXQXQXQXQXQXQ', 'user', 3);
