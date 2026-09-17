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
import examRoutes from './src/routes/exam.js';

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
app.use('/api/exam', examRoutes);

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

// Support country root paths just like Cloudflare _redirects
app.get(['/ng', '/gh', '/us'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'index.html'));
});

// Catch-all for country sub-paths to support direct links (Express 5 compatible)
app.use((req, res, next) => {
  const match = req.path.match(/^\/(ng|gh|us)\/(.*)$/);
  if (match) {
    const [_, cc, subpath] = match;
    let target = '';

    if (subpath.startsWith('study/classroom/')) target = 'study/classroom/classroom_questions.html';
    else if (subpath === 'study/classroom') target = 'study/classroom/classroom_subject.html';
    else if (subpath.startsWith('study/past-questions/')) target = 'study/study_past_questions/study_explanation.html';
    else if (subpath === 'study/past-questions') target = 'study/study_past_questions/study_subject.html';
    else if (subpath.startsWith('test/')) {
      if (subpath === 'test') target = 'cbt_test/core/setup.html';
      else if (subpath === 'test/result') target = 'cbt_test/core/result.html';
      else if (subpath === 'test/analysis') target = 'cbt_test/core/deep_analysis.html';
      else if (subpath === 'test/jamb-mock') target = 'cbt_test/jamb_mock_exam/mock_date_and_point.html';
      else if (subpath === 'test/live-arena') target = 'cbt_test/live_quiz_arena/exam_body.html';
      else if (subpath === 'test/live-arena/instruction') target = 'cbt_test/live_quiz_arena/instruction.html';
      else if (subpath === 'test/secondary') target = 'cbt_test/secondary_school/all_classes.html';
      else if (subpath === 'test/post-utme') target = 'cbt_test/core/university_exam_post_utme.html';
      else if (subpath === 'test/university') target = 'cbt_test/university_exam/university_exam.html';
      else if (subpath === 'test/instruction') target = 'cbt_test/core/instruction.html';
      else target = 'cbt_test/core/cbt_player.html';
    }
    else if (subpath.startsWith('blog/')) target = 'blog/content.html';
    else if (subpath === 'blog') target = 'blog/categories.html';
    else {
      // Direct file fallback
      target = subpath;
    }

    const filePath = path.join(__dirname, 'public', 'modules', target);
    return res.sendFile(filePath, (err) => {
      if (err) next();
    });
  }
  next();
});

// ── Clean URL rewrites (match Vercel rewrites in vercel.json) ──
app.get('/wallet-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'top_up', 'wallet_dashboard.html'));
});
app.get('/paystack-inline-checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'top_up', 'paystack_inline_checkout.html'));
});
app.get('/amount-entry', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'top_up', 'amount_entry.html'));
});
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'pricing.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'auth', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'auth', 'sign_up.html'));
});
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'auth', 'otp.html'));
});
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'auth', 'fill_form.html'));
});

// Map old module paths to clean paths (fallback via 301)
app.use('/modules', (req, res) => {
  const subpath = req.path; // e.g. /auth/login.html

  if (subpath === '/pricing')              return res.redirect(301, '/ng/pricing');
  if (subpath === '/auth/login.html')      return res.redirect(301, '/login');
  if (subpath === '/auth/sign_up.html')    return res.redirect(301, '/signup');
  if (subpath === '/auth/otp.html')        return res.redirect(301, '/verify');
  if (subpath === '/auth/fill_form.html')  return res.redirect(301, '/onboarding');

  // Landing pages -> clean URLs
  if (subpath === '/landing/nigeria-jamb.html')             return res.redirect(301, '/ng/landing/jamb');
  if (subpath === '/landing/nigeria-waec.html')             return res.redirect(301, '/ng/landing/waec');
  if (subpath === '/landing/nigeria-neco.html')             return res.redirect(301, '/ng/landing/neco');
  if (subpath === '/landing/nigeria-uniben-post-utme.html') return res.redirect(301, '/ng/landing/uniben-post-utme');
  if (subpath === '/landing/ghana-waec.html')               return res.redirect(301, '/gh/landing/waec');
  if (subpath === '/landing/usa-sat.html')                  return res.redirect(301, '/us/landing/sat');

  // Footer pages -> clean URLs
  if (subpath === '/footer/about_us.html')         return res.redirect(301, '/ng/about-us');
  if (subpath === '/footer/contact_us.html')       return res.redirect(301, '/ng/contact-us');
  if (subpath === '/footer/privacy_policy.html')   return res.redirect(301, '/ng/privacy-policy');
  if (subpath === '/footer/terms_of_service.html') return res.redirect(301, '/ng/terms-of-service');
  if (subpath === '/footer/disclaimer.html')       return res.redirect(301, '/ng/disclaimer');

  // Global fallback
  const clean = subpath.startsWith('/') ? subpath.slice(1) : subpath;
  res.redirect(301, '/ng/' + clean);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
