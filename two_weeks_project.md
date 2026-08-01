# 2-Week Project Completion Plan: Exam Companion

Since you are roughly 80% done with the UI, this 2-week sprint focuses entirely on bringing the app to life. The goal is to build out a **100% No Credit Card Backend (Node.js + MongoDB Atlas)**, configure **Cloudflare R2** for fast data delivery, connect your beautiful UI to these services, and deploy everything for a $0 budget.

---

## 🎯 Week 1: Core Backend, Auth, and Database

### Day 1: MongoDB Atlas & Render Setup
*   **Goal:** Get your free-tier database and hosting environment ready.
*   **Tasks:**
    *   Sign up for **MongoDB Atlas** (M0 Free Tier) and create a database cluster (no card required).
    *   Set up a database user and configure IP Access to allow all connections (`0.0.0.0/0`).
    *   Retrieve your MongoDB Connection String.
    *   Sign up for **Render.com** using your GitHub account (this is where the backend will live).

### Day 2: Backend Skeleton & API Routing
*   **Goal:** Initialize the Node.js/Express backend locally.
*   **Tasks:**
    *   Initialize a new Node.js project.
    *   Set up Express, CORS, and body-parser.
    *   Connect Express to your MongoDB Atlas database using Mongoose or the native driver.
    *   Set up a basic health-check route (e.g., `GET /api/health`) to verify the database connection.

### Day 3: Authentication APIs (Signup & Login)
*   **Goal:** Build the logic for user registration and login.
*   **Tasks:**
    *   Create `POST /api/auth/signup` to accept email and password. Hash the password using `bcrypt`.
    *   Create `POST /api/auth/login` to verify credentials and return a **JWT (JSON Web Token)**.
    *   Ensure the user document saves the `country` field (e.g., `ng`, `gh`).

### Day 4: OTP Verification & Profile Completion
*   **Goal:** Complete the authentication flow on the backend.
*   **Tasks:**
    *   Create `POST /api/auth/send-otp` (integrate with a free email service like Resend or SendGrid) and `POST /api/auth/verify-otp`.
    *   Create `POST /api/user/profile` to accept the user's Country, State, Age, University, and Course, and update the MongoDB document.

### Day 5: Cloudflare R2 Setup (The Data Layer)
*   **Goal:** Set up the $0 egress static file storage.
*   **Tasks:**
    *   Create a Cloudflare R2 bucket.
    *   Configure CORS on the bucket so your frontend domain can fetch files.
    *   Create the folder structure: `/config`, `/ng/exams`, `/gh/exams`.
    *   Upload a dummy `app_config.json` and a dummy exam `jamb.json` to test the URLs.

### Day 6 & 7: Frontend Auth Integration
*   **Goal:** Connect your UI forms to your new backend.
*   **Tasks:**
    *   Update `login.html`, `sign_up.html`, `otp.html`, and `fill_form.html` to make actual `fetch()` calls to your locally running Node.js API.
    *   On successful login, store the returned JWT and the `user_country` in `localStorage`.
    *   Update `sidebar.js` (AppTopbar) to verify the JWT token validity instead of just checking a string.

---

## 🚀 Week 2: Dynamic Features, Testing, and Deployment

### Day 8: Dynamic Config & Dashboard Data
*   **Goal:** Make the frontend dynamic based on the user's country.
*   **Tasks:**
    *   In `index.html` (or a central `api.js` script), fetch `https://your-r2-url.com/config/app_config.json` on load.
    *   Read `localStorage.getItem('user_country')`.
    *   Update the WhatsApp buttons, currency symbols, and news feeds on the dashboard dynamically based on the fetched config and the user's country.

### Day 9: CBT Exam Engine (Fetching Data)
*   **Goal:** Connect the CBT board to Cloudflare R2.
*   **Tasks:**
    *   When a user clicks an exam (e.g., JAMB), use their stored `user_country` to fetch the correct JSON file: `fetch("https://your-r2-url.com/" + country + "/exams/jamb.json")`.
    *   Load the fetched JSON array into your existing CBT UI state so the user can take the test.

### Day 10: Exam Submission & Leaderboard API
*   **Goal:** Track scores and rank users.
*   **Tasks:**
    *   **Backend:** Create `POST /api/exams/submit` to receive the score, calculate points, and increment the user's `total_score` in MongoDB Atlas.
    *   **Backend:** Create `GET /api/leaderboard/:country` to query the top 100 students for a specific country.
    *   *Crucial DB Step:* Inside MongoDB Atlas, create a compound index on `{ country: 1, total_score: -1 }` to make this query lightning fast.
    *   **Frontend:** Connect the CBT submit button to the submit API.

### Day 11: Leaderboard UI Integration
*   **Goal:** Display the dynamic rankings.
*   **Tasks:**
    *   Build out the Leaderboard UI (if not fully done).
    *   Fetch the leaderboard data from your backend, passing the local `user_country`.
    *   Populate the UI with the top students.

### Day 12: AI Study Agent Integration
*   **Goal:** Bring the AI Tutor to life.
*   **Tasks:**
    *   **Backend:** Create a secure endpoint `POST /api/ai/chat` that accepts a prompt and communicates with OpenAI/Gemini using your API keys (never put API keys in the frontend).
    *   **Frontend:** Connect the AI chat interface to this endpoint.

### Day 13: QA & End-to-End Testing
*   **Goal:** Break things before your users do.
*   **Tasks:**
    *   Register as a Nigerian user, take an exam, and check the leaderboard.
    *   Log out. Register as a Ghanaian user. Verify the WhatsApp link changes, the exam JSON changes, and you appear on a different leaderboard.
    *   Test on mobile viewports to ensure all modals (like the auth flow) are perfectly responsive.

### Day 14: Final Deployment (Render & Cloudflare Pages)
*   **Goal:** Go Live!
*   **Tasks:**
    *   **Backend:** Deploy your Node.js code to **Render.com** (it automatically builds and provides a live `onrender.com` URL).
    *   **Frontend:** Update your frontend `fetch` calls to point to your live Render URL.
    *   **Frontend Deployment:** Connect your frontend GitHub repository to **Cloudflare Pages** (deploying the `public` folder). Cloudflare will handle serving the HTML and caching your JSON data for zero cost!
