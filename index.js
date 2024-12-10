const express = require('express');
const multer = require('multer');
const path = require('path');
const { Client } = require('pg'); // مكتبة PostgreSQL
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config(); // تحميل المتغيرات البيئية

// إنشاء التطبيق
const app = express();
const port = process.env.PORT || 3000;

// إعداد اتصال قاعدة البيانات PostgreSQL
const client = new Client({
    host: process.env.DB_HOST, // عنوان السيرفر
    user: process.env.DB_USER, // اسم المستخدم
    password: process.env.DB_PASSWORD, // كلمة المرور
    database: process.env.DB_NAME, // اسم قاعدة البيانات
    port: process.env.DB_PORT || 5432, // المنفذ
});

// التحقق من اتصال قاعدة البيانات
client.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('Connected to PostgreSQL database');
});

// إعداد Multer لتخزين الملفات المرفوعة
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images'; // المجلد الخاص بحفظ الصور
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); // إنشاء المجلد إذا لم يكن موجودًا
        cb(null, dir); // حفظ الملفات في المجلد المحدد
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`; // تعيين اسم مميز للملف
        req.body.image = `images/${fileName}`; // تخزين المسار داخل الطلب
        cb(null, fileName); // تعيين الاسم النهائي
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json()); // قراءة بيانات JSON في الطلبات
app.use('/public', express.static(path.join(__dirname, 'public'))); // استضافة الملفات العامة

/**
 * إضافة منتج جديد
 * @route POST /products
 */
app.post('/products', upload.single('image'), (req, res) => {
    const { title, price, scope, category, fame, num, description } = req.body;
    const image = req.file ? req.file.filename : null; // استخدام اسم الملف المحفوظ

    // التحقق من الحقول المطلوبة
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required' });
    }

    const sql = `
        INSERT INTO products (title, price, scope, category, fame, num, description, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `;
    const values = [title, price, scope, category, fame, num, description, image];

    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err); // طباعة التفاصيل هنا
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.status(201).json({ id: result.rows[0].id, ...req.body });
    });
});


/**
 * جلب كل المنتجات
 * @route GET /products
 */
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    client.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        // إرسال قائمة المنتجات
        res.status(200).json(results.rows);
    });
});

/**
 * حذف منتج معين
 * @route DELETE /products/:id
 */
app.delete('/products/:id', (req, res) => {
    const { id } = req.params; // استخراج المعرف من الطلب
    const sql = 'DELETE FROM products WHERE id = $1';
    client.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    });
});

/**
 * تعديل منتج معين
 * @route PUT /products/:id
 */
app.put('/products/:id', upload.single('image'), (req, res) => {
    const { id } = req.params; // استخراج المعرف
    const { title, description, price } = req.body; // استخراج البيانات
    const image = req.body.image;

    const sql = `
        UPDATE products
        SET title = $1, description = $2, price = $3, image = $4
        WHERE id = $5
        RETURNING *`;
    const values = [title, description, price, image, id];
    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err); // عرض التفاصيل الكاملة للخطأ
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.status(201).json({ id: result.rows[0].id, ...req.body });
    });
    
    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(result.rows[0]);
    });
});

// بدء تشغيل الخادم
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
