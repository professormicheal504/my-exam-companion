# My Exam Companion - Comprehensive Global Backend Architecture

## 🏗️ Architecture Overview

The backend is designed for global scale, zero-latency content delivery, and robust data management. We separate operational data (which requires fast read/writes and relationships) from large media storage (which requires cheap, high-bandwidth streaming).

1. **Core Database & Authentication (Supabase)**: Handles user authentication (JWT/OTP), real-time chat, and relational queries (the "small data").
2. **Media & Large Data Storage (Cloudflare R2)**: Handles large assets like CBT JSON bundles, topic videos, past question PDFs, and high-res images.
3. **Global Edge Delivery (Cloudflare CDN & Workers)**: Handles caching, security, and edge-level geographic routing.

---

## 🌍 Geo-Targeting & Regional Content (The "Country Switch")

To ensure that a user switching to the "USA" (or any other country) sees only content relevant to that region, the architecture uses a combination of **Edge Detection** and **Database Partitioning by Country Code**.

### 1. Cloudflare Workers (Edge Detection)
Using Cloudflare Workers, we read the `CF-IPCountry` header from incoming requests.
- **Auto-Detection**: If a user connects from the USA, Cloudflare sets a session cookie or header (`x-user-country: US`).
- **Manual Override**: The user can manually change their country via the UI (e.g., the country filter dropdown in `all_rooms.html`). This overrides the auto-detection.

### 2. Supabase Schema Design (Country-Scoped Data)
Every major content table in Supabase includes a `country_code` column. When the frontend queries Supabase, it passes the active country code to ensure the UI instantly updates to show:
- USA Tutors & Hubs
- USA Exam Bodies (e.g., SAT, AP instead of JAMB, WAEC)
- USA specific blogs, articles, leaderboards, and mock exams.

---

## 🗄️ Comprehensive Database Structure (Supabase)
Based on a deep scan of all UI modules, here is the complete relational schema mapping every feature:

### 1. Users, Auth, & Referrals (`auth`, `profile`, `referrals`)
- **auth.users**: Built-in Supabase authentication (email/password, OTP).
- **profiles**: `id`, `role` (student/tutor), `display_name`, `country_code`, `state`, `age`, `university`, `course_of_study`, `avatar_url`, `total_score` (for ranking), `created_at`.
- **referrals**: `id`, `referrer_id`, `referred_user_id`, `bonus_awarded`, `created_at`.

### 2. Tutor Hubs & Courses (`exam_hub` module)
- **rooms (Hubs)**: `id`, `tutor_id`, `hub_name`, `bio`, `primary_subject`, `secondary_subject`, `country_code`, `exam_body` (e.g., JAMB, WAEC), `is_active`.
- **courses**: `id`, `room_id`, `title`, `description`, `thumbnail_url`.
- **course_enrollments**: `id`, `course_id`, `student_id`, `progress_percent`.

### 3. CBT Engine & Leaderboard (`cbt_test`, `rank` modules)
- **exams**: `id`, `room_id`, `title`, `duration_mins`, `total_questions`, `reward_type`.
- **exam_submissions**: `id`, `exam_id`, `student_id`, `score`, `time_taken`, `submitted_at`.
- **leaderboard_cache**: A materialized view or indexed table caching the top students sorted by `total_score` descending, partitioned by `country_code` for lightning-fast rank fetching.

### 4. Blog & News (`blog` module)
- **articles**: `id`, `title`, `author_id`, `content`, `tags`, `country_code`, `hero_image_url`, `views`.
- **comments**: `id`, `article_id`, `user_id`, `comment_text`, `created_at`.
- **likes**: `id`, `article_id`, `user_id`.

### 5. Chat & AI Study Agent (`chat`, `AI_study_agent` modules)
- **chat_messages**: `id`, `sender_id`, `receiver_id` (or `room_id`), `message_text`, `is_read`, `created_at`. Supabase Realtime is enabled on this table.
- **ai_chat_history**: `id`, `user_id`, `prompt`, `ai_response`, `created_at`.

### 6. Study Planner & Tasks (`study_planner`, `task` modules)
- **study_plans**: `id`, `user_id`, `subject`, `scheduled_time`, `is_completed`.
- **tasks**: `id`, `creator_id` (tutor), `assignee_id` (student), `task_description`, `due_date`, `status`.

### 7. Tutor Earnings & Wallet (`earnings` module)
- **wallet**: `id`, `user_id`, `balance`, `currency`.
- **transactions**: `id`, `wallet_id`, `amount`, `type` (exam_reward, course_purchase, withdrawal), `status`, `created_at`.

---

## 📦 Storage Architecture (Cloudflare R2 - Large Data)

We use Cloudflare R2 for all heavy assets to maintain zero/low bandwidth costs.

1. **Cloudflare R2 Bucket Structure (`mec-media`)**:
   - `/config/app_config.json` (Dynamic UI config, WhatsApp links based on country)
   - `/{country_code}/exams/{exam_body}.json` (e.g., `/ng/exams/jamb.json` - massive JSON dumps of past questions for the CBT engine).
   - `/videos/` (Tutor uploaded video courses).
   - `/images/` (Blog heroes, profile pictures).

2. **Upload Workflow (Zero Backend Bottleneck)**:
   - A Tutor uploads a 500MB video course.
   - Frontend requests an upload token.
   - Supabase Edge Function securely signs an R2 URL.
   - Frontend uploads the video directly to Cloudflare R2.
   - The UI saves only the lightweight CDN URL (e.g., `https://cdn.myexamcompanion.com/videos/vid_123.mp4`) into the Supabase `courses` table.

---

## 📂 Backend and File Structure

```text
my_exam_companion/
│
├── .env                     # Environment variables (Supabase keys, Cloudflare API)
│
├── public/                  # Frontend UI (HTML/CSS/JS)
│   ├── components/          # Reusable UI (topbar, sidebar, footer)
│   ├── modules/
│   │   ├── AI_study_agent/  # AI Chat interface
│   │   ├── auth/            # Login, Signup, OTP, Profile Completion
│   │   ├── blog/            # Articles and news (content.html)
│   │   ├── cbt_test/        # The CBT Engine simulator loading R2 JSONs
│   │   ├── chat/            # Real-time messaging UI
│   │   ├── earnings/        # Tutor revenue & student rewards
│   │   ├── exam_hub/        # Tutor rooms, courses, and student exploration
│   │   ├── rank/            # Global/Regional Leaderboards
│   │   ├── referrals/       # Referral dashboard
│   │   ├── study_planner/   # Timetables and scheduling
│   │   └── task/            # Assignments and tracking
│   └── assets/              # Icons, global css
│
├── supabase/                # Supabase Backend Infrastructure
│   ├── migrations/          # SQL scripts for creating all the tables listed above
│   ├── seed.sql             # Dummy data for testing
│   └── functions/           # Edge functions (e.g., R2 presigned URLs, AI API proxy)
│
└── cloudflare/              # Cloudflare Edge Logic
    └── worker.js            # Handles CF-IPCountry routing and CDN caching
```

## 🚀 Summary of the Data Flow
1. **Student visits UI**: Cloudflare Worker detects location (e.g., `US`) or reads local storage preference.
2. **Frontend loads config**: UI fetches `/config/app_config.json` from R2 to configure local currency and links.
3. **Data Fetch (Small Data)**: Supabase quickly returns JSON relational data (`SELECT * FROM rooms WHERE country_code = 'US'`).
4. **Media Fetch (Large Data)**: Images, CBT JSON question banks, and videos on the page are loaded blazing fast from Cloudflare's edge CDN, providing a seamless experience regardless of the user's geographic location.
