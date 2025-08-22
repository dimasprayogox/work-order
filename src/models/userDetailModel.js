import { db } from "../core/config/knex.js";

/**
 * Get combined user profile by user_id using a JOIN.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} - A single object with combined user and detail data.
 */
export const getUserDetailByUserId = (userId) => {
  return db("users")
    .leftJoin("user_details", "users.id", "=", "user_details.user_id")
    // left join divisions so users without a division still return
    .leftJoin("divisions", "users.division_id", "=", "divisions.id")
    .where("users.id", userId)
    .select(
      // Kolom dari tabel 'users'
      "users.id",
      "users.username",
      "users.email",
      "users.full_name",
      "users.role",
      "users.is_active",
      // Kolom dari tabel 'user_details'
      "user_details.profile_photo_url",
      "user_details.phone_number",
      "user_details.address",
      "user_details.city",
      "user_details.country",
      "user_details.date_of_birth",
  "user_details.bio",
  // include division name if present
  "divisions.name as division_name"
    )
    .first(); // .first() untuk mengambil satu objek hasil saja
};

/**
 * Create user detail (biasanya dipanggil saat registrasi user baru).
 * Fungsi ini tidak diubah karena tujuannya spesifik untuk membuat detail baru.
 */
export const addUserDetail = async (detailData) => {
  await db("user_details").insert(detailData);
  return db("user_details").where({ user_id: detailData.user_id }).first();
};

/**
 * Update combined user profile (users and user_details) in a single transaction.
 * @param {string} userId - The ID of the user to update.
 * @param {object} userData - Data to update in the 'users' table.
 * @param {object} detailsData - Data to update in the 'user_details' table.
 * @returns {Promise<object>} - The updated combined profile data.
 */
export const updateUserProfile = async (userId, userData, detailsData) => {
  await db.transaction(async (trx) => {
    // 1. Update tabel 'users' jika ada data untuk diupdate
    if (Object.keys(userData).length > 0) {
      await trx("users").where({ id: userId }).update(userData);
    }

    // 2. Jika ada detailsData, lakukan upsert pada tabel 'user_details'
    if (Object.keys(detailsData).length > 0) {
      // Cek apakah record user_details untuk user ini sudah ada
      const existing = await trx("user_details").where({ user_id: userId }).first();

      if (existing) {
        // Jika ada, lakukan update
        await trx("user_details").where({ user_id: userId }).update(detailsData);
      } else {
        // Jika belum ada, sisipkan record baru dengan user_id
        await trx("user_details").insert({ ...detailsData, user_id: userId });
      }
    }
  });

  // 3. Setelah transaksi sukses, kembalikan data gabungan terbaru
  return getUserDetailByUserId(userId);
};

// Fungsi lama 'updateUserDetailByUserId' sudah tidak diperlukan karena digantikan oleh 'updateUserProfile'.
