# Global Backend Architecture: My Exam Companion

This document outlines the detailed backend architecture for the application, designed to scale globally. It leverages **Supabase** (PostgreSQL) for structured, relational data and **Cloudflare R2 + GitHub (via jsDelivr)** for large, unstructured storage like images, exam assets, and study materials.

## 1. High-Level Architecture

*   **Database (Relational & Simple Data):** Supabase (PostgreSQL). It handles all user authentication, profiles, transactional data, exam progress, blog content, AI chat logs, and billing.
*   **Storage (Large Assets):** 
    *   **Cloudflare R2:** Used for large user-generated content (profile pictures, file uploads, audio/video data) and private static assets. It offers zero egress fees, making it perfect for high-bandwidth applications.
    *   **GitHub + jsDelivr:** Used for public static assets (UI images, public study materials, past question assets). jsDelivr acts as a free, globally distributed CDN to serve these assets blazingly fast.
*   **Authentication:** Supabase Auth (Email OTP, OAuth like Google/Apple, and Phone OTP).
*   **Backend Logic:** Supabase Edge Functions and Node.js/Express server for custom workflows (payment webhooks, AI agent processing).

---

## 2. Database Schema (Supabase / PostgreSQL)

Below is the detailed schema for the database, covering 10+ core modules (pages) of the application.

### 1. Users Module (`auth.users`)
Managed automatically by Supabase.
*   `id` (UUID, Primary Key)
*   `email` (String)
*   `phone` (String)
*   `created_at` (Timestamp)
*   `last_sign_in_at` (Timestamp)

### 2. User Profiles Module (`public.profiles`)
Stores app-specific user data.
*   `id` (UUID, Primary Key, Foreign Key to `auth.users.id`)
*   `first_name` (String)
*   `last_name` (String)
*   `avatar_url` (String - points to Cloudflare R2)
*   `country` (String)
*   `education_level` (String)
*   `target_exam` (String, e.g., "JAMB", "WAEC")
*   `updated_at` (Timestamp)

### 3. Subscription & Billing Module (`public.subscriptions`)
Tracks user subscription plans and active status.
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key to `profiles.id`)
*   `plan_name` (String, e.g., "Free", "Premium")
*   `status` (Enum: "active", "canceled", "expired")
*   `current_period_start` (Timestamp)
*   `current_period_end` (Timestamp)
*   `payment_gateway` (String, e.g., "Paystack", "Stripe")

### 4. Courses / Subjects Module (`public.subjects`)
Defines the subjects available for study and exams.
*   `id` (UUID, Primary Key)
*   `name` (String, e.g., "Mathematics", "English")
*   `category` (String, e.g., "Science", "Arts")
*   `description` (Text)
*   `icon_url` (String - points to GitHub/jsDelivr)

### 5. Exam Studio / Past Questions Module (`public.exams`)
Holds metadata for various exams.
*   `id` (UUID, Primary Key)
*   `exam_board` (String, e.g., "JAMB", "Post-UTME")
*   `year` (Integer)
*   `subject_id` (UUID, Foreign Key to `subjects.id`)
*   `duration_minutes` (Integer)
*   `total_questions` (Integer)

### 6. Questions Bank Module (`public.questions`)
Stores the actual questions for the Exam Studio.
*   `id` (UUID, Primary Key)
*   `exam_id` (UUID, Foreign Key to `exams.id`)
*   `question_text` (Text)
*   `image_url` (String, Nullable - points to GitHub/jsDelivr)
*   `option_a` (String)
*   `option_b` (String)
*   `option_c` (String)
*   `option_d` (String)
*   `correct_option` (Enum: "A", "B", "C", "D")
*   `explanation` (Text)

### 7. User Test Progress & History Module (`public.test_sessions`)
Tracks when a user takes a test.
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key to `profiles.id`)
*   `exam_id` (UUID, Foreign Key to `exams.id`)
*   `score` (Integer)
*   `start_time` (Timestamp)
*   `end_time` (Timestamp)
*   `status` (Enum: "in_progress", "completed", "abandoned")

### 8. AI Study Agent (Tutor) Chat History (`public.ai_chat_sessions`)
Stores conversation history with the AI Tutor.
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key to `profiles.id`)
*   `session_title` (String)
*   `subject_context` (String, Nullable)
*   `created_at` (Timestamp)

### 9. AI Chat Messages (`public.ai_chat_messages`)
Individual messages within a chat session.
*   `id` (UUID, Primary Key)
*   `session_id` (UUID, Foreign Key to `ai_chat_sessions.id`)
*   `sender_role` (Enum: "user", "ai")
*   `content` (Text)
*   `media_url` (String, Nullable - points to Cloudflare R2 for user uploads)
*   `created_at` (Timestamp)

### 10. Blog & News Module (`public.blog_posts`)
Manages content for the "Blog" section (e.g., Scholarships, Exam News).
*   `id` (UUID, Primary Key)
*   `title` (String)
*   `slug` (String, Unique)
*   `content` (Text - Markdown or HTML)
*   `author_name` (String)
*   `category` (String, e.g., "JAMB", "Scholarships")
*   `cover_image_url` (String - points to Cloudflare R2 or jsDelivr)
*   `published_at` (Timestamp)
*   `views` (Integer)

### 11. Notifications Module (`public.notifications`)
In-app alerts and notifications for the user.
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, Foreign Key to `profiles.id`)
*   `title` (String)
*   `message` (Text)
*   `is_read` (Boolean, Default: false)
*   `type` (Enum: "system", "exam_reminder", "subscription", "blog")
*   `created_at` (Timestamp)

### 12. Upcoming Events / Calendar Module (`public.events`)
For the "Upcoming Events" widget in the right sidebar.
*   `id` (UUID, Primary Key)
*   `title` (String, e.g., "JAMB Registration Closes")
*   `description` (Text)
*   `event_date` (Timestamp)
*   `target_audience` (String, Nullable)

---

## 3. Large Storage Strategy

### Cloudflare R2 (Private/User-Generated Data)
*   **Use Cases:** User avatars, PDF uploads to the AI Tutor, audio/voice notes sent to the AI, and exportable result sheets.
*   **Why R2?** Zero egress fees mean that as your user base grows and downloads study materials or uploads files, you will not be charged astronomical bandwidth fees compared to AWS S3.
*   **Integration:** Accessed securely via pre-signed URLs generated by your Node.js backend or Supabase Edge Functions.

### GitHub + jsDelivr (Public Static Assets)
*   **Use Cases:** Question diagrams, subject icons, UI SVGs, public JSON datasets (if any), and CSS/JS bundles.
*   **Why jsDelivr?** By hosting static assets in a public GitHub repository and routing them through jsDelivr, you get a global CDN with edge caching for absolutely free.
*   **Format:** `https://cdn.jsdelivr.net/gh/your-username/your-repo@branch/path/to/image.png`
*   **Performance:** Extremely fast load times for the Exam Studio, as images for questions are cached at edge nodes closest to the student.

---

## 4. Next Steps for Implementation
1. **Supabase Setup:** Create the Supabase project and execute the SQL scripts to build the 12+ tables listed above. Implement Row Level Security (RLS) policies to ensure users can only see their own test history and chats.
2. **Storage Provisioning:** 
   - Create a Cloudflare R2 bucket (`exam-companion-uploads`).
   - Create a GitHub repository (`exam-companion-assets`) and configure jsDelivr URLs.
3. **API Integration:** Connect the frontend (`fetch` or `@supabase/supabase-js`) to interact directly with Supabase for data fetching and mutations.
