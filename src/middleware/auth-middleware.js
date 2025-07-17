import { verifyToken } from "../utils/jwt.js"


export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    return res.status(401).json({ errors: "Authorization token is missing" })
  }

  const isValid = await verifyToken(token);

  req.user = isValid
  next()
}

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