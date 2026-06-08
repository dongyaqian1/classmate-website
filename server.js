const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 数据文件 ==========
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 读取数据
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取数据文件失败:', e.message);
  }
  return [];
}

// 写入数据
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ========== 文件上传配置 ==========
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(8).toString('hex');
    cb(null, name + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式：jpg、png、gif、webp、bmp'));
    }
  }
});

// ========== 中间件 ==========
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== API 路由 ==========

// 上传同学信息
app.post('/api/submit', upload.single('photo'), (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '请输入姓名' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '请输入留言' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '请上传照片' });
    }

    const data = readData();
    const record = {
      id: uuidv4(),
      name: name.trim(),
      message: message.trim(),
      photo: '/uploads/' + req.file.filename,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    data.push(record);
    writeData(data);

    res.json({ success: true, message: '提交成功！' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
});

// 获取所有同学信息（需要验证密码）
app.post('/api/list', (req, res) => {
  const { password } = req.body;

  // 管理密码，你可以改成自己的
  const ADMIN_PASSWORD = '929566';

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '密码错误' });
  }

  const data = readData();
  // 按时间倒序
  data.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json({ success: true, data });
});

// 删除某条记录
app.post('/api/delete', (req, res) => {
  const { password, id } = req.body;

  const ADMIN_PASSWORD = '929566';

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '密码错误' });
  }

  let data = readData();
  const record = data.find(r => r.id === id);
  if (record) {
    // 删除对应的照片文件
    const photoPath = path.join(__dirname, 'public', record.photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }
  data = data.filter(r => r.id !== id);
  writeData(data);

  res.json({ success: true, message: '已删除' });
});

// ========== 错误处理 ==========
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '图片不能超过 10MB' });
    }
    return res.status(400).json({ error: '上传出错：' + err.message });
  }
  if (err.message && err.message.includes('只支持图片格式')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: '服务器错误' });
});

// ========== 启动服务 ==========
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  📖 同学录网站已启动！');
  console.log('----------------------------------------');
  console.log(`  提交页：http://localhost:${PORT}`);
  console.log(`  管理页：http://localhost:${PORT}/admin.html`);
  console.log(`  管理密码：929566`);
  console.log('========================================');
});
