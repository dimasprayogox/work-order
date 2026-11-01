# Work Order Management System - Backend API

RESTful API backend untuk Work Order Management System, platform manajemen pemeliharaan mesin, pelaporan insiden (*issue*), penugasan teknisi, jadwal pemeliharaan preventif, serta inventaris suku cadang berbasis Role-Based Access Control (RBAC).

Repository Branch: `backend`

---

## Daftar Isi
- [Fitur Utama](#fitur-utama)
- [Hak Akses & Role](#hak-akses--role)
- [Teknologi](#teknologi)
- [Struktur Direktori](#struktur-direktori)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Konfigurasi Lingkungan (.env)](#konfigurasi-lingkungan-env)
- [Migrasi & Seeding Database](#migrasi--seeding-database)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Dokumentasi Tambahan](#dokumentasi-tambahan)

---

## Fitur Utama

- **Role-Based Access Control (RBAC)**: Autentikasi JWT dengan verifikasi otorisasi ketat untuk 5 tingkatan pengguna (*Admin, Manager, Technician, Logistics, Employee*).
- **Work Order & Assignment**: Siklus hidup perintah kerja dari pengajuan, penugasan teknisi, tracking status (*Pending, In Progress, Completed*), hingga verifikasi.
- **Maintenance Schedules**: Penjadwalan pemeliharaan rutin/preventif mesin berbasis kalender dan frekuensi berkala.
- **Issue / Work Request Reporting**: Pelaporan kendala mesin oleh operator/karyawan langsung dari lini operasional.
- **Inventory & Spare Parts Management**: Manajemen master suku cadang, pengajuan kebutuhan suku cadang (*Part Requests*), dan pencatatan konsumsi (*Part Usage*).
- **Asset & Machine Registry**: Registrasi mesin, kategori mesin, divisi penempatan, status operasional, dan riwayat kerusakan.
- **Reporting & Export**: Ekspor data laporan operasional dan log kerja ke format Microsoft Excel (.xlsx).
- **File & Media Storage**: Pengelolaan berkas dan dokumentasi visual terintegrasi MinIO Object Storage.

---

## Hak Akses & Role

| Role | Deskripsi Tanggung Jawab |
| :--- | :--- |
| **Admin** | Manajemen pengguna, divisi, kategori mesin, aset, suku cadang, penugasan WO, serta approval permintaan suku cadang. |
| **Manager** | Monitoring dashboard eksekutif, reviu progres work order, jadwal pemeliharaan, serta performa teknisi. |
| **Technician** | Mengerjakan work order penugasan, pembaruan status pengerjaan, dan pengajuan suku cadang pengganti. |
| **Logistics** | Pengelolaan stok suku cadang, pemrosesan permintaan komponen, dan validasi riwayat penggunaan spare part. |
| **Employee** | Pelaporan kendala/kerusakan mesin (*Issue Submission*) dan monitoring tiket work order terkait. |

---

## Teknologi

- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/) v4
- **Database**: [MySQL](https://www.mysql.com/) / [MariaDB](https://mariadb.org/)
- **Query Builder & ORM**: [Knex.js](https://knexjs.org/) & [Objection.js](https://vincit.github.io/objection.js/)
- **Authentication**: JWT via [`jose`](https://github.com/panva/jose) & [`bcrypt`](https://github.com/kelektiv/node.bcrypt.js)
- **Validation**: [Zod](https://zod.dev/)
- **Storage Service**: [MinIO Client](https://min.io/) & [Multer](https://github.com/expressjs/multer)
- **Data Export**: [ExcelJS](https://github.com/exceljs/exceljs)
- **HTTP Logger**: [Morgan](https://github.com/expressjs/morgan)

---

## Struktur Direktori

```text
backend/
├── docs/
│   └── API_DOCS.md               # Spesifikasi lengkap endpoint API
├── src/
│   ├── controllers/              # Controller terisolasi per role
│   │   ├── admin/
│   │   ├── employee/
│   │   ├── manager/
│   │   ├── technician/
│   │   └── logistic/
│   ├── core/
│   │   └── config/               # Inisialisasi koneksi Knex & DB
│   ├── middleware/               # Auth, RBAC, header, upload, error handler
│   ├── migrations/               # Skema migrasi database
│   ├── models/                   # Definisi model Objection.js
│   ├── routes/                   # Definisi rute per role & modul
│   │   ├── admin/
│   │   ├── employee/
│   │   ├── manager/
│   │   ├── technician/
│   │   ├── logistic/
│   │   └── auth.routes.js
│   ├── schemas/                  # Schema validasi Zod
│   ├── seeds/                    # Data seeder database
│   └── app.js                    # Konfigurasi middleware & router Express
├── knexfile.js                   # Konfigurasi koneksi Knex environment
├── package.json
└── server.js                     # Entry point server HTTP
```

---

## Persyaratan Sistem

- Node.js `>= 18.x`
- MySQL Server `>= 8.0` atau MariaDB `>= 10.5`
- MinIO Server (opsional untuk penyimpanan berkas lokal/cloud)
- npm / pnpm / yarn

---

## Instalasi & Menjalankan

1. **Clone repository dan beralih ke branch backend**:
   ```bash
   git clone -b backend https://github.com/dimasprayogox/work-order.git
   cd work-order/backend # atau cd work-order jika root branch backend
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Buat file environment**:
   ```bash
   cp .env.example .env # sesuaikan variabel kredensial database
   ```

4. **Jalankan migrasi dan seeding data awal**:
   ```bash
   npm run migrate:latest
   npm run seed:master
   ```

5. **Jalankan server dalam mode pengembangan**:
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:3000` (atau port sesuai konfigurasi `.env`).

---

## Konfigurasi Lingkungan (.env)

Buat file `.env` pada root direktori backend dengan parameter berikut:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=work_order_db

# Security & JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

# MinIO Storage (Opsional / Upload Gambar)
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key
MINIO_BUCKET_NAME=work-order
```

---

## Migrasi & Seeding Database

Script CLI Knex tersedia di `package.json`:

```bash
# Menjalankan seluruh migrasi terbaru
npm run migrate:latest

# Rollback seluruh migrasi
npm run db:reset

# Menjalankan master seeder
npm run seed:master

# Menjalankan seluruh seeder
npm run seed:run
```

---

## Ringkasan Endpoint API

Base URL: `http://localhost:3000/api`

### 1. Autentikasi (`/auth`)
- `POST /auth/login` - Login pengguna & penerbitan token JWT
- `POST /auth/register` - Registrasi pengguna baru

### 2. User Detail (`/user-detail`)
- `GET /user-detail` - Mendapatkan profil pengguna aktif
- `PUT /user-detail` - Memperbarui profil pengguna

### 3. Administrator (`/admin`)
- `/admin/dashboard` - Statistik agregat performa WO, isu, dan mesin
- `/admin/users` - CRUD manajemen akun pengguna & penetapan peran
- `/admin/divisions` - CRUD master data divisi kerja
- `/admin/machines` & `/admin/machine-categories` - CRUD mesin operasional & kategori
- `/admin/assets` & `/admin/asset-categories` - CRUD aset inventaris
- `/admin/parts` - CRUD suku cadang & kontrol stok
- `/admin/part-requests` - Reviu, persetujuan, dan status permintaan suku cadang
- `/admin/issues` - Monitoring & delegasi kendala yang dilaporkan
- `/admin/work-order-assignments` - Penugasan teknisi untuk work order terbuka
- `/admin/schedules` - Penjadwalan pemeliharaan preventif berkala

### 4. Manager (`/manager`)
- `/manager/dashboard` - Visualisasi performa, grafik tren, dan metrik operasional
- `/manager/work-orders` - Reviu work order seluruh divisi
- `/manager/schedules` - Monitoring kepatuhan jadwal pemeliharaan
- `/manager/technicians` - Monitoring beban kerja teknisi
- `/manager/machines` & `/manager/assets` - Pengawasan status peralatan

### 5. Technician (`/technician`)
- `/technician/dashboard` - Statistik work order aktif teknisi
- `/technician/work-orders` - Daftar tugas WO, update progres pengerjaan & penyelesaian
- `/technician/part-request` - Pengajuan suku cadang untuk perbaikan mesin

### 6. Logistics (`/logistics`)
- `/logistics/dashboard` - Statistik perputaran suku cadang & permintaan komponen
- `/logistics/parts` - Manajemen katalog suku cadang & kuantitas gudang
- `/logistics/part-requests` - Validasi & penyaluran permintaan suku cadang teknisi
- `/logistics/part-usage` - Audit riwayat pemakaian suku cadang per work order

### 7. Employee (`/employee`)
- `/employee/dashboard` - Ringkasan status tiket masalah karyawan
- `/employee/issues` - Pelaporan kerusakan/kendala mesin baru
- `/employee/work-orders` - Tracking tindak lanjut work order perbaikan mesin

---

## Dokumentasi Tambahan

Detail spesifikasi request payload, query parameters, dan format response JSON tersedia di:
- [docs/API_DOCS.md](./docs/API_DOCS.md)
