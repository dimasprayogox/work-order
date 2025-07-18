/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  // 1. Hapus semua data lama di tabel user_details
  await knex("user_details").del();

  // 2. Ambil semua user dari tabel 'users' untuk mendapatkan ID mereka
  const users = await knex("users").select("id", "full_name", "role");

  // Hentikan proses jika tidak ada user ditemukan
  if (!users.length) {
    console.log("Tidak ada user ditemukan, seeder user_details dilewati.");
    return;
  }

  // 3. Siapkan data detail untuk setiap user
  const userDetailsData = users.map((user) => {
    return {
      user_id: user.id, // Ini adalah kunci relasi
      profile_photo_url: `https://i.pravatar.cc/150?u=${user.id}`,
      phone_number: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: "Jl. Merdeka No. 17, Tulungagung",
      city: "Tulungagung",
      country: "Indonesia",
      date_of_birth: "1995-05-10",
      bio: `Ini adalah bio untuk ${user.full_name} dengan peran sebagai ${user.role}.`,
    };
  });

  // 4. Masukkan data detail yang sudah disiapkan ke dalam tabel
  await knex("user_details").insert(userDetailsData);
};
