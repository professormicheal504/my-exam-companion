# Multi-Country UI & Backend Strategy ($0 Budget)

This document outlines the architectural strategy for scaling the Exam Companion platform to multiple countries while maintaining a **$0 Backend Budget** using Cloudflare Pages, Cloudflare R2, and an Oracle VM (MongoDB + Auth).

## 1. The Core Philosophy (Build Once, Serve Everywhere)
You **do not** need to redesign the UI for every country. You design the UI exactly once. The only thing that changes is the **data** injected into the UI based on the user's selected country.

### Dynamic Data Fetching
When a user signs up, prompt them to select their country. Save this choice locally and in the database.
```javascript
// Save locally
localStorage.setItem('user_country', 'ng'); 

// Fetch data dynamically based on the stored country
const country = localStorage.getItem('user_country') || 'ng'; 
const url = `https://r2.yourdomain.com/${country}/exams/cbt.json`;
```

---

## 2. Cloudflare R2 Folder Structure (The Data Layer)
Cloudflare R2 is perfect for serving static files (Questions, News, Tasks, Leaderboard cache) because it caches heavily at the edge and costs $0 in egress fees.

Your R2 bucket must be structured using standard **ISO Country Codes** (e.g., `ng` for Nigeria, `gh` for Ghana, `ke` for Kenya).

```text
📦 your-cloudflare-r2-bucket
 ┣ 📂 config
 ┃ ┗ 📜 app_config.json        (Global settings: currencies, whatsapp links per country)
 ┣ 📂 ng                       (Nigeria)
 ┃ ┣ 📂 exams                  (jamb.json, waec.json, neco.json)
 ┃ ┣ 📂 news                   (daily_news.json)
 ┃ ┣ 📂 tasks                  (tasks.json)
 ┃ ┗ 📂 syllabus               (physics_jamb.json)
 ┣ 📂 gh                       (Ghana)
 ┃ ┣ 📂 exams                  (wassce.json, novdec.json)
 ┃ ┣ 📂 news                   (daily_news.json)
 ┃ ┣ 📂 tasks                  (tasks.json)
 ┃ ┗ 📂 syllabus               (math_wassce.json)
 ┗ 📂 ke                       (Kenya)
   ┣ 📂 exams                  (kcse.json)
   ┣ 📂 news                   (daily_news.json)
   ┗ 📂 tasks                  (tasks.json)
```
*When 10,000 students from Ghana request `gh/exams/wassce.json`, it hits the Cloudflare Edge Cache. Your Oracle VM is never touched, costing you nothing.*

---

## 3. Frontend Project Folder Structure
Your frontend code (hosted on Cloudflare Pages) remains completely country-agnostic. The UI components are reused for everyone.

```text
📦 my_exam_companion
 ┣ 📂 public
 ┃ ┣ 📂 assets                 (Logos, global CSS, shared fonts)
 ┃ ┣ 📂 components             (Reusable UI widgets)
 ┃ ┃ ┣ 📜 app-sidebar.js
 ┃ ┃ ┣ 📜 app-topbar.js
 ┃ ┃ ┗ 📜 country-selector.js  (Modal that pops up for new users)
 ┃ ┣ 📂 modules
 ┃ ┃ ┣ 📂 auth                 (Login/Signup UI)
 ┃ ┃ ┣ 📂 cbt_test             (The CBT Board - fetches R2 data based on localStorage)
 ┃ ┃ ┣ 📂 news                 (News feed - fetches country-specific news)
 ┃ ┃ ┣ 📂 leaderboard          (Leaderboard UI - sends country code to Oracle VM)
 ┃ ┃ ┗ 📂 AI_study_agent       (AI Chat Interface)
 ┃ ┣ 📂 scripts
 ┃ ┃ ┣ 📜 api.js               (Handles dynamic routing: appending `/${country}/` to R2 calls)
 ┃ ┃ ┗ 📜 utils.js
 ┃ ┗ 📜 index.html             (Dashboard)
```
*Note how there is no `ng` or `gh` folder in the frontend project. The UI modules are singular and adapt to the data they receive.*

---

## 4. Backend & MongoDB Strategy (Oracle VM)
Your Oracle VM handles dynamic, write-heavy actions: Authentication, saving scores, and querying the dynamic leaderboard.

### Database Design
Instead of creating separate databases for each country, use a single database and add a `country` field to every document.

**Users Collection Example:**
```json
{
  "_id": "user123",
  "name": "Ojehomon",
  "country": "ng",
  "total_score": 1450,
  "whatsapp_joined": false
}
```

**Leaderboard Query (Node.js on Oracle VM):**
When the frontend asks for the leaderboard, it sends the user's country code. Your backend queries MongoDB specifically for that country.
```javascript
// Get Top 10 students for a specific country
app.get('/api/leaderboard/:country', async (req, res) => {
  const topStudents = await db.collection('users')
    .find({ country: req.params.country })
    .sort({ total_score: -1 })
    .limit(10)
    .toArray();
  res.json(topStudents);
});
```

> [!WARNING]
> **Database Optimization:** You MUST create a MongoDB **Index** on the `country` field (`db.users.createIndex({ country: 1, total_score: -1 })`). Since your Oracle VM Free Tier has limited RAM (usually 1GB or 24GB on Ampere), indexing prevents the database from crashing when you scale to millions of users.

---

## 5. Global Config & WhatsApp Links
You mentioned having different WhatsApp groups for different countries. You manage this by storing a single `app_config.json` in your Cloudflare R2 bucket (`config/app_config.json`).

```json
{
  "ng": {
    "currency": "₦",
    "whatsapp_link": "https://chat.whatsapp.com/nigeria-group",
    "exam_types": ["JAMB", "WAEC", "NECO"]
  },
  "gh": {
    "currency": "GH₵",
    "whatsapp_link": "https://chat.whatsapp.com/ghana-group",
    "exam_types": ["WASSCE", "NOVDEC"]
  }
}
```
When the user's dashboard loads, it fetches this config, reads their country code, and automatically injects the correct WhatsApp link into the UI button.

---

## 6. The $0 Budget Data Flow
This architecture perfectly aligns with a zero-cost strategy:

1. **Visit:** User visits site (Served by Cloudflare Pages - **$0**).
2. **Config:** UI reads `localStorage.getItem('user_country')`. If empty, shows Country Selector modal.
3. **Login:** Hits Oracle VM Docker Auth. Returns JWT token containing the user's country (**$0**, inside Oracle Always Free limits).
4. **Dashboard Setup:** Frontend fetches `config/app_config.json` from R2 and sets the WhatsApp links and news feeds based on the country code.
5. **CBT Start:** User clicks "Start Exam". Frontend fetches `https://r2.domain.com/{country}/exams/jamb.json` (Cached globally by Cloudflare Edge - **$0 Egress**).
6. **Finish:** Score is sent back to Oracle VM and saved in MongoDB with `{ country: "ng" }`.
7. **Leaderboard:** Frontend requests Leaderboard. Oracle VM runs a fast indexed query for users where `country = "ng"` and returns it.
