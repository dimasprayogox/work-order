import { verifyToken } from "../utils/jwt.js"


export const authMiddleware = async (req, res, next) => {
  // --- PERBAIKAN DI SINI ---
  // Ambil token dari cookie, bukan dari header
  const token = req.cookies.authToken;

  // Cek jika token tidak ada di cookie
  if (!token) {
    return res.status(401).json({ errors: "Authorization token is missing" });
  }

  try {
    // Verifikasi token yang didapat dari cookie
    const decodedUser = await verifyToken(token);

    if (!decodedUser) {
      return res.status(401).json({ errors: "Token tidak valid" });
    }

    // Simpan data pengguna ke request
    req.user = decodedUser;
    next(); // Lanjutkan ke controller
  } catch (error) {
    return res
      .status(401)
      .json({ errors: "Token tidak valid atau terjadi error" });
  }
};

export const refreshTokenMiddleware = async (req, res, next) => {
  const token = req.headers["x-refresh-token"]

  if (!token) {
    return res.status(401).json({ errors: "Authorization token is missing" })
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ errors: "Refresh token expired" })
    }

    if (!decoded) {
      return res.status(401).json({ errors: "Unauthorized" })
    }

    req.user = { id: decoded.id, email: decoded.email, exp: decoded.exp }
    next()
  })
}