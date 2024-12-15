const express = require('express');
const multer = require('multer');
const path = require('path');
const { Client } = require('pg'); // مكتبة PostgreSQL
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

require('dotenv').config(); // تحميل المتغيرات البيئية


// إنشاء التطبيق
const app = express();
const port = process.env.PORT || 3000;

// إعداد اتصال قاعدة البيانات PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL, // استخدام الرابط من المتغيرات البيئية
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
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`; // اسم فريد للملف
        req.body.image = `${fileName}`; // تخزين الرابط الكامل للصورة
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

/** 
 * 1. إضافة منتج جديد
 */
app.post('/products', upload.single('image'), (req, res) => {
    const { title, price, scope, category, fame, num, description } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة

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
            console.error('Error inserting product:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.status(201).json({ id: result.rows[0].id, ...req.body, image });
    });
});

/** 
 * 2. إضافة تصنيف جديد
 */
app.post('/categories', upload.single('image'), (req, res) => {
    const { category } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة

    if (!category) {
        return res.status(400).json({ error: 'Category is required' });
    }

    const sql = `
        INSERT INTO categories (category, images)
        VALUES ($1, $2)
        RETURNING id
    `;
    const values = [category, image];

    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting category:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.status(201).json({ id: result.rows[0].id, category, image });
    });
});

/**
 * 3. جلب كل المنتجات
 */
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

/**
 * 4. جلب كل التصنيفات
 */
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    client.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(results.rows);
    });
});

/**
 * 5. حذف منتج
 */
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
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
 * 6. حذف تصنيف
 */
app.delete('/categories/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM categories WHERE id = $1';
    client.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    });
});

/**
 * 7. تحديث منتج
 */
app.put('/products/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, description, price } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة

    const sql = `
        UPDATE products
        SET title = $1, description = $2, price = $3, images = $4
        WHERE id = $5
        RETURNING *
    `;
    const values = [title, description, price, image, id];

    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(result.rows[0]);
    });
});

/**
 * 8. تحديث تصنيف
 */

/**
 * 9. تحديث منتج جزئي
 */
app.patch('/products/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, description, price, scope, category, fame, num } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة إذا تم تحميل صورة جديدة

    // بناء جملة SQL ديناميكية بناءً على البيانات المدخلة
    let updateQuery = 'UPDATE products SET';
    let values = [];
    let counter = 1;

    if (title) {
        updateQuery += ` title = $${counter++},`;
        values.push(title);
    }
    if (description) {
        updateQuery += ` description = $${counter++},`;
        values.push(description);
    }
    if (price) {
        updateQuery += ` price = $${counter++},`;
        values.push(price);
    }
    if (scope) {
        updateQuery += ` scope = $${counter++},`;
        values.push(scope);
    }
    if (category) {
        updateQuery += ` category = $${counter++},`;
        values.push(category);
    }
    if (fame) {
        updateQuery += ` fame = $${counter++},`;
        values.push(fame);
    }
    if (num) {
        updateQuery += ` num = $${counter++},`;
        values.push(num);
    }
    if (image) {
        updateQuery += ` images = $${counter++},`;
        values.push(image);
    }

    // إزالة الفاصلة الزائدة في النهاية
    updateQuery = updateQuery.slice(0, -1);
    updateQuery += ` WHERE id = $${counter}`;
    values.push(id);

    client.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(result.rows[0]);
    });
});
/**
 * 10. تحديث تصنيف جزئي
 */
app.patch('/categories/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة إذا تم تحميل صورة جديدة

    // بناء جملة SQL ديناميكية بناءً على البيانات المدخلة
    let updateQuery = 'UPDATE categories SET';
    let values = [];
    let counter = 1;

    if (category) {
        updateQuery += ` category = $${counter++},`;
        values.push(category);
    }
    if (image) {
        updateQuery += ` images = $${counter++},`;
        values.push(image);
    }

    // إزالة الفاصلة الزائدة في النهاية
    updateQuery = updateQuery.slice(0, -1);
    updateQuery += ` WHERE id = $${counter}`;
    values.push(id);

    client.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(result.rows[0]);
    });
});

app.put('/categories/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    const image = req.body.image; // استخدام الرابط الكامل للصورة

    const sql = `
        UPDATE categories
        SET category = $1, images = $2
        WHERE id = $3
        RETURNING *
    `;
    const values = [category, image, id];

    client.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(result.rows[0]);
    });
});

// بدء تشغيل الخادم
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
