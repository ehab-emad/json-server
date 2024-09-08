
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || 30001;

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.originalname}`;
    req.body.image = `images/${fileName}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// إضافة صورة إلى المنتج
server.post('/products', upload.single('image'), (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({ error: 'No data provided' });
  }

  req.body.createdAt = new Date().toISOString();

  // Continue to JSON Server router
  next();
});

// استخدام Middlewares
server.use(middlewares);

// استخدام Router
server.use(router);

// بدء تشغيل الخادم
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
