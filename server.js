import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import connectDB from './src/config/db.js';
import healthRoutes from './src/routes/health.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Proxy /r2 requests to Cloudflare R2 bucket (since local dev server doesn't use _redirects)
app.use('/r2', async (req, res) => {
  const targetUrl = `https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev${req.url}`;
  try {
    const fetchRes = await fetch(targetUrl);
    res.status(fetchRes.status);
    fetchRes.headers.forEach((val, key) => {
        // Do not forward encoding or length headers since Node fetch decompresses automatically
        if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
            res.setHeader(key, val);
        }
    });
    const buffer = await fetchRes.arrayBuffer();
    // Using res.end() prevents Express from overriding the Content-Type
    res.end(Buffer.from(buffer));
  } catch (e) {
    res.status(500).send('Error proxying to R2: ' + e.message);
  }
});

// Serve static files from the 'public' directory
// This makes /r2_staging_area/... and /modules/... URLs work in local dev
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));

// Serve new_staging_area data files (configs, exam data, etc.)
// new_staging_area/ is at the project root, outside of public/
app.use('/new_staging_area', express.static(path.join(__dirname, 'new_staging_area'), {
  maxAge: '1d'
}));

// Serve the main app for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
