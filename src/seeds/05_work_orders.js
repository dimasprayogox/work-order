import crypto from 'crypto';

export async function seed(knex) {
  await knex('work_orders').del();
  console.log('Tabel work_orders berhasil dikosongkan.');

  const machines = await knex("machines").select("id", "machine_code");
  const users = await knex("users").select("id", "username");
  const issues = await knex("issues").select("id", "title", "machine_id");

  const machineCnc = machines.find((m) => m.machine_code === "CNC-001");
  const userAdmin = users.find((u) => u.username === "admin");
  const userTechnician = users.find((u) => u.username === "technician");
  const existingIssue = issues.find((i) => i.title.includes("Mesin CNC-001 Mati Total"));


  if (!machineCnc) { console.warn("Peringatan: Machine 'CNC-001' tidak ditemukan, Work Order tidak akan dibuat."); return; }
  if (!userAdmin) { console.warn("Peringatan: User 'admin' tidak ditemukan, Work Order tidak akan dibuat."); return; }
  if (!existingIssue) { console.warn("Peringatan: Issue 'Mesin CNC-001 Mati Total' tidak ditemukan, Work Order tidak akan dibuat atau issue_id akan null."); }


  await knex("work_orders").insert([
    {
      id: crypto.randomUUID(),
      title: "Perbaikan Spindle Mesin CNC-001",
      description: "Spindle mengeluarkan suara aneh, perlu diperiksa.",
      machine_id: machineCnc.id,
      assigned_to_id: userTechnician ? userTechnician.id : null,
      created_by_id: userAdmin.id,
      issue_id: existingIssue ? existingIssue.id : null,
      priority: "high",
      status: "in_progress",
      scheduled_date: new Date(new Date().setDate(new Date().getDate() + 7)),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: crypto.randomUUID(),
      title: "Pengecekan Rutin Mesin Press",
      description: "Pengecekan dan perawatan rutin mingguan pada mesin press.",
      machine_id: machines.find(m => m.machine_code === "PRESS-002")?.id || machineCnc.id,
      assigned_to_id: null,
      created_by_id: userAdmin.id,
      issue_id: null,
      priority: "low",
      status: "pending",
      scheduled_date: new Date(new Date().setDate(new Date().getDate() + 3)),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
        id: crypto.randomUUID(),
        title: "Pembersihan Area Produksi",
        description: "Pembersihan menyeluruh di area produksi setiap bulan.",
        machine_id: machines.find(m => m.machine_code === "PRESS-002")?.id || machineCnc.id,
        assigned_to_id: userTechnician ? userTechnician.id : null,
        created_by_id: userAdmin.id,
        issue_id: null,
        priority: "medium",
        status: "in_progress",
        scheduled_date: new Date(new Date().setDate(new Date().getDate() - 5)),
        started_at: new Date(new Date().setDate(new Date().getDate() - 4)),
        created_at: new Date(new Date().setDate(new Date().getDate() - 7)),
        updated_at: new Date(new Date().setDate(new Date().getDate() - 4)),
    },
    {
        id: crypto.randomUUID(),
        title: "Perbaikan Sistem Pendingin",
        description: "Sistem pendingin mesin CNC-001 tidak berfungsi optimal.",
        machine_id: machineCnc.id,
        assigned_to_id: userTechnician ? userTechnician.id : null,
        created_by_id: userAdmin.id,
        issue_id: null,
        priority: "medium",
        status: "completed",
        scheduled_date: new Date(new Date().setDate(new Date().getDate() - 10)),
        started_at: new Date(new Date().setDate(new Date().getDate() - 9)),
        completed_at: new Date(new Date().setDate(new Date().getDate() - 8)),
        created_at: new Date(new Date().setDate(new Date().getDate() - 15)),
        updated_at: new Date(new Date().setDate(new Date().getDate() - 8)),
    }
  ]);
  console.log('Data work_orders berhasil di-seed.');
}