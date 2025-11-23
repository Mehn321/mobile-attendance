const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// Initialize database
const dbPath = path.join(__dirname, 'qr_attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      check_in_time DATETIME NOT NULL,
      status TEXT DEFAULT 'present',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);
});

// Auth Routes
app.post('/api/auth/signup', (req, res) => {
  const { email, password, role } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role || 'user'],
      function (err) {
        if (err) return res.status(400).json({ error: 'Email already exists' });
        res.json({ id: this.lastID, email });
      }
    );
  });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    });
  });
});

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Students Routes
app.get('/api/students', authMiddleware, (req, res) => {
  db.all('SELECT * FROM students WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/students', authMiddleware, (req, res) => {
  const { name, student_id, image_url } = req.body;

  db.run(
    'INSERT INTO students (user_id, name, student_id, image_url) VALUES (?, ?, ?, ?)',
    [req.user.id, name, student_id, image_url],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, user_id: req.user.id, name, student_id, image_url });
    }
  );
});

// Classes Routes
app.get('/api/classes', authMiddleware, (req, res) => {
  db.all('SELECT * FROM classes WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/classes', authMiddleware, (req, res) => {
  const { name, description } = req.body;

  db.run(
    'INSERT INTO classes (user_id, name, description) VALUES (?, ?, ?)',
    [req.user.id, name, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, user_id: req.user.id, name, description });
    }
  );
});

// Attendance Routes
app.post('/api/attendance', authMiddleware, (req, res) => {
  const { student_id, class_id } = req.body;

  db.run(
    'INSERT INTO attendance_records (student_id, class_id, check_in_time, status) VALUES (?, ?, datetime("now"), "present")',
    [student_id, class_id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, student_id, class_id, status: 'present' });
    }
  );
});

app.get('/api/attendance/:class_id', authMiddleware, (req, res) => {
  const { class_id } = req.params;

  db.all(
    `SELECT ar.*, s.name, s.student_id 
     FROM attendance_records ar 
     JOIN students s ON ar.student_id = s.id 
     WHERE ar.class_id = ?`,
    [class_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Email Confirmation Page
app.get('/confirm-email', (req, res) => {
  const { token_hash, type } = req.query;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirming Email - QR Attendance</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            font-size: 40px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success {
            color: #4caf50;
        }
        .error {
            color: #f44336;
        }
        .link-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .link-button:hover {
            background: #764ba2;
        }
        .code {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
            word-break: break-all;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📧</div>
        <div id="content">
            <h1>Confirming Email...</h1>
            <div class="spinner"></div>
            <p>Please wait while we confirm your email address.</p>
        </div>
    </div>

    <script>
        const tokenHash = '${token_hash}';
        const type = '${type}' || 'email';
        const contentDiv = document.getElementById('content');

        async function confirmEmail() {
            try {
                if (!tokenHash) {
                    throw new Error('No confirmation token found');
                }

                // Wait a moment then redirect to app
                await new Promise(resolve => setTimeout(resolve, 1500));

                const deepLinkUrl = \`qr-attendance://auth?token_hash=\${tokenHash}&type=\${type}\`;
                
                contentDiv.innerHTML = \`
                    <h1 class="success">✓ Email Confirmed!</h1>
                    <p>Your email has been confirmed successfully.</p>
                    <p>Opening app...</p>
                    <div class="spinner"></div>
                \`;

                // Try to open the app
                window.location.href = deepLinkUrl;

                // Fallback: show message after 3 seconds if app didn't open
                setTimeout(() => {
                    contentDiv.innerHTML = \`
                        <h1 class="success">✓ Email Confirmed!</h1>
                        <p>Your email has been confirmed successfully.</p>
                        <p>Please open the QR Attendance app to continue.</p>
                        <a href="\${deepLinkUrl}" class="link-button">Open App</a>
                    \`;
                }, 3000);

            } catch (error) {
                contentDiv.innerHTML = \`
                    <h1 class="error">✗ Confirmation Failed</h1>
                    <p>\${error.message}</p>
                    <p>Please try signing up again or contact support.</p>
                \`;
                console.error('Email confirmation error:', error);
            }
        }

        // Start confirmation process
        confirmEmail();
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'QR Attendance API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
