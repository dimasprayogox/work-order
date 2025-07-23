// src/seeds/05_work_orders.js
import crypto from 'crypto'; // Untuk crypto.randomUUID()

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Menghapus entri Work Order yang sudah ada terlebih dahulu
  // Ini harus dilakukan setelah issues (jika work_orders merujuk issues)
  // dan sebelum users/machines yang mungkin dirujuk oleh work_orders
  await knex('work_orders').del();
  console.log('Tabel work_orders berhasil dikosongkan.');

  // Ambil data yang sudah ada dari tabel lain yang dibutuhkan
  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");
  const issues = await knex("issues").select("id", "title", "machine_id"); // Perlu issues untuk issue_id

  // Mencari entitas spesifik yang akan digunakan untuk work orders
  // Penting: Pastikan user dan machine ini SUDAH ADA (dibuat di seeder sebelumnya)
  const machineCnc = machines.find((m) => m.machine_code === "CNC-001");
  const userAdmin = users.find((u) => u.username === "admin");
  const userTechnician = users.find((u) => u.username === "technician"); // Pastikan nama pengguna 'technician' sesuai
  const existingIssue = issues.find((i) => i.title.includes("Mesin CNC-001 Mati Total")); // Ambil isu yang sudah ada

  // PENTING: Periksa apakah semua entitas ditemukan sebelum digunakan
  if (!machineCnc) { console.warn("Peringatan: Machine 'CNC-001' tidak ditemukan, Work Order tidak akan dibuat."); return; }
  if (!userAdmin) { console.warn("Peringatan: User 'admin' tidak ditemukan, Work Order tidak akan dibuat."); return; }
  if (!userTechnician) { console.warn("Peringatan: User 'technician' tidak ditemukan, Work Order tidak akan dibuat."); return; }
  if (!existingIssue) { console.warn("Peringatan: Issue 'Mesin CNC-001 Mati Total' tidak ditemukan, Work Order tidak akan dibuat atau issue_id akan null."); }


  // Masukkan data Work Order
  await knex("work_orders").insert([
    {
      id: crypto.randomUUID(),
      title: "Perbaikan Spindle Mesin CNC-001",
      description: "Spindle mengeluarkan suara aneh, perlu diperiksa. (Dibuat dari 05_work_orders)",
      machine_id: machineCnc.id,
      assigned_to_id: userTechnician.id,
      created_by_id: userAdmin.id,
      issue_id: existingIssue ? existingIssue.id : null, // Hubungkan ke isu yang sudah ada, atau null jika tidak ada
      priority: "high",
      status: "in_progress",
      scheduled_date: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 hari dari sekarang
      created_at: new Date(),
      updated_at: new Date(),
      // Kolom 'technician_notes', 'started_at', 'completed_at' bisa diisi NULL atau default
    },
    {
      id: crypto.randomUUID(),
      title: "Perbaikan Sistem Pendingin",
      description: "Sistem pendingin mesin CNC-001 tidak berfungsi optimal.",
      machine_id: machineCnc.id,
      assigned_to_id: userTechnician.id,
      created_by_id: userAdmin.id,
      issue_id: null, // Contoh work order tanpa issue terkait
      priority: "medium",
      status: "completed",
      scheduled_date: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 hari dari sekarang
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);
  console.log('Data work_orders berhasil di-seed.');
}