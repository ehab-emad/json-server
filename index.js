const express = require('express');
const multer = require('multer');
const path = require('path');
const { Client } = require('pg'); // استيراد مكتبة pg الخاصة بـ PostgreSQL
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// إعداد اتصال قاعدة البيانات PostgreSQL
const client = new Client({
    host: process.env.DB_HOST, // عنوان السيرفر من متغيرات البيئة
    user: process.env.DB_USER, // اسم المستخدم من متغيرات البيئة
    password: process.env.DB_PASSWORD, // كلمة المرور من متغيرات البيئة
    database: process.env.DB_NAME, // اسم قاعدة البيانات من متغيرات البيئة
    port: process.env.DB_PORT || 5432, // المنفذ الافتراضي لـ PostgreSQL
});

client.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('Connected to PostgreSQL database');
});

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        req.body.image = `images/${fileName}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// إضافة منتج جديد
app.post('/products', upload.single('image'), (req, res) => {
    const { name, description, price } = req.body;
    const image = req.body.image;

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const sql = 'INSERT INTO products (name, description, price, image) VALUES ($1, $2, $3, $4) RETURNING id';
    const values = [name, description, price, image];

    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.rows[0].id, ...req.body });
    });
});

// جلب كل المنتجات
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    client.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(results.rows);
    });
});

// بدء تشغيل الخادم
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
