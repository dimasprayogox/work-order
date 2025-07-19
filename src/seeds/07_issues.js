// src/seeds/07_issues.js
import crypto from 'crypto'; // Untuk crypto.randomUUID()

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Menghapus entri Issue yang sudah ada
  // Ini harus dilakukan sebelum work_orders jika work_orders merujuk issues
  await knex('issues').del();
  console.log('Tabel issues berhasil dikosongkan.');

  // Ambil data yang sudah ada dari tabel lain yang dibutuhkan
  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");

  // Mencari entitas spesifik yang akan digunakan untuk issues
  // PENTING: Pastikan user dan machine ini SUDAH ADA (dibuat di seeder sebelumnya)
  const machineCnc = machines.find((m) => m.machine_code === "CNC-001");
  const userEmployee = users.find((u) => u.username === "employee");
  const userAdmin = users.find((u) => u.username === "admin"); // Mungkin perlu untuk created_by_id di WorkOrderController

  // PENTING: Periksa apakah entitas ditemukan
  if (!machineCnc) { console.warn("Peringatan: Machine 'CNC-001' tidak ditemukan, Issue tidak akan dibuat."); return; }
  if (!userEmployee) { console.warn("Peringatan: User 'employee' tidak ditemukan, Issue tidak akan dibuat."); return; }
  if (!userAdmin) { console.warn("Peringatan: User 'admin' tidak ditemukan."); } // Mungkin tidak kritis untuk issue, tapi penting untuk WorkOrder

  // Masukkan data Issues
  await knex('issues').insert([
    {
      id: crypto.randomUUID(), // Issue pertama
      machine_id: machineCnc.id,
      title: "Mesin CNC-001 Mati Total",
      description: "Mesin tiba-tiba mati dan tidak bisa dihidupkan kembali setelah tegangan listrik naik turun.",
      status: "open",
      reported_by_id: userEmployee.id,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: crypto.randomUUID(), // Issue kedua
      machine_id: machineCnc.id,
      title: "Kebocoran Oli pada Mesin CNC-001",
      description: "Terdeteksi tetesan oli di bawah mesin, perlu pemeriksaan segera untuk menghindari kerusakan lebih lanjut.",
      status: "open",
      reported_by_id: userEmployee.id,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  console.log('Data issues berhasil di-seed.');
}