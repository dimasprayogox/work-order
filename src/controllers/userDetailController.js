import {
  getUserDetailByUserId,
  updateUserProfile,
} from "../models/userDetailModel.js";

export const show = async (req, res) => {
  try {
    const userId = req.user.userId; // dari JWT middleware
    const detail = await getUserDetailByUserId(userId);
    if (!detail)
      return res.status(404).json({ message: "Detail tidak ditemukan" });
    res.json({ message: "Success", data: detail });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body;

    // 2. Pisahkan data untuk masing-masing tabel
    const userData = {};
    const detailsData = {};

    // Daftar field untuk tabel 'users'
    const userFields = ["username", "full_name", "email"];
    // Daftar field untuk tabel 'user_details'
    const detailFields = [
      "phone_number",
      "address",
      "city",
      "country",
      "date_of_birth",
      "bio",
    ];

    userFields.forEach((field) => {
      if (body[field] !== undefined) {
        userData[field] = body[field];
      }
    });

    detailFields.forEach((field) => {
      if (body[field] !== undefined) {
        detailsData[field] = body[field];
      }
    });

    // Cek jika tidak ada data yang valid untuk diupdate
    if (
      Object.keys(userData).length === 0 &&
      Object.keys(detailsData).length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tidak ada data valid untuk diperbarui." });
    }

    // 3. Panggil fungsi model yang baru dengan DUA objek data
    const updatedProfile = await updateUserProfile(
      userId,
      userData,
      detailsData
    );

    res.json({ message: "Profil berhasil diperbarui", data: updatedProfile });
  } catch (err) {
    // Tangani error duplikat email jika ada
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email sudah digunakan." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};