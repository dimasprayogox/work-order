export async function notifyManager({ subject, message, issueId, machineId }) {
    // Implementasi notifikasi ke manager, misal via email, push, dsb.
    // Untuk dummy, cukup log ke console.
    console.log(`[NOTIFY MANAGER] ${subject}: ${message} (Issue: ${issueId}, Machine: ${machineId})`);
    // Bisa tambahkan integrasi email, Telegram, dsb di sini.
    return true;
}