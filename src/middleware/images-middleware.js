import multer from "multer";

export const imagesErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Ukuran file terlalu besar. Batas maksimal adalah 1MB.",
        
      });
    }


    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Field atau jenis file tidak sesuai.",
      });
    }

    return res.status(400).json({ message: err.message });
  }

  next(err);
};
