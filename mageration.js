const { Client } = require('pg'); // مكتبة PostgreSQL
const fs = require('fs');
require('dotenv').config(); // تحميل المتغيرات البيئية
if (!fs.existsSync('db.json')) {
    console.error('File db.json not found!');
    return;
  }
  const data = JSON.parse(fs.readFileSync('db.json'));
  

// إعداد الاتصال بقاعدة البيانات PostgreSQL
const db = new Client({
    host: process.env.DB_HOST, // عنوان السيرفر
    user: process.env.DB_USER, // اسم المستخدم
    password: process.env.DB_PASSWORD, // كلمة المرور
    database: process.env.DB_NAME, // اسم قاعدة البيانات
    port: process.env.DB_PORT || 3000, // المنفذ
});

// فتح الاتصال بقاعدة البيانات
db.connect(err => {
  if (err) throw err;
  console.log('Connected to the PostgreSQL database!');
});

// دالة لإدخال بيانات المنتجات
const insertProduct = (product) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO products (id, title, description, price, scope, category, fame, num, desc, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const values = [
      product.id,
      product.title,
      product.description || '',
      product.price,
      product.scope,
      product.category,
      product.fame || 'no',
      product.num || '',
      product.desc || '',
      product.images,
    ];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// دالة لإدخال بيانات الفئات
const insertCategory = (category) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO categories (id, category, images)
      VALUES ($1, $2, $3)
    `;
    const values = [category.id, category.category, category.images];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// دالة لإدخال كل البيانات
const insertData = async () => {
  try {
    // إدخال بيانات المنتجات والفئات
    const productPromises = data.products.map(insertProduct);
    const categoryPromises = data.allcatogray.map(insertCategory);

    await Promise.all([...productPromises, ...categoryPromises]);
    console.log('All data inserted successfully');
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    // إغلاق الاتصال بعد الانتهاء
    db.end();
  }
};

// تنفيذ دالة الإدخال
insertData();
