import { getUserByEmail } from "../models/userModel.js";
import { loginSchema } from "../schemas/authSchema.js";
import { datetime, status } from "../utils/general.js";
import { comparePassword } from "../utils/hash.js";
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Validasi gagal",
        datetime: datetime(),
        errors: validation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
    }

    const { email, password } = validation.data;

    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "User tidak ditemukan",
        datetime: datetime(),
      });
    }

    const isPasswordTrue = await comparePassword(
      password,
      existingUser["password"]
    );
    if (!isPasswordTrue) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Password salah",
        datetime: datetime(),
      });
    }

    const token = await generateToken({
      userId: existingUser["id"],
      role: existingUser["role"],
    });

    const refreshToken = await generateRefreshToken({
      userId: existingUser["id"],
      role: existingUser["role"],
    });

    // Set cookie for token
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data User berhasil di dapatkan",
      userId: existingUser["id"],
      role: existingUser["role"],
      datetime: datetime(),
      token,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: `Terjadi kesalahan pada server: ${error.message}`,
      datetime: datetime(),
    });
  }
};



//refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Refresh token diperlukan",
        datetime: datetime(),
      });
    }

    // Verifikasi refresh token
    let payload;
    try {
      payload = await verifyToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        status: status.GAGAL,
        message: "Refresh token tidak valid atau sudah expired",
        datetime: datetime(),
      });
    }

    // Buat access token baru
    const newToken = await generateToken({
      userId: payload.userId,
      role: payload.role,
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Token berhasil diperbarui",
      datetime: datetime(),
      token: newToken,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: `Terjadi kesalahan pada server: ${error.message}`,
      datetime: datetime(),
    });
  }
};
