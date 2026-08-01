# The "Million Dollar" Architecture: Enterprise Content Engine

To build a platform capable of serving millions of students across **Nigeria, Ghana, South Africa, Kenya, and the USA**, the architecture must shift from a traditional "website" to a **Headless Content Engine**. 

In this enterprise-grade design, the frontend is merely a "Renderer". It knows absolutely nothing about exams, countries, or flashcards. It only knows how to parse JSON schemas delivered by Cloudflare's Global Edge Network (R2).

This ensures that adding a completely new type of exam (e.g., a new Kenyan National Exam, or a medical certification) requires **zero code deployment**. You simply push a JSON payload.

---

## 1. The Global Edge Data Layer (Cloudflare R2)

R2 serves your data globally at $0 egress cost. By placing data at the edge, a student in Kenya downloads the config from a server in Nairobi, while a student in the US downloads it from New York.

### Master Global Index (`global_countries.json`)
This file powers the "Country Selector" UI globally.
```json
{
  "ng": { "name": "Nigeria", "currency": "₦", "flag_url": "/assets/flags/ng.svg" },
  "gh": { "name": "Ghana", "currency": "₵", "flag_url": "/assets/flags/gh.svg" },
  "za": { "name": "South Africa", "currency": "R", "flag_url": "/assets/flags/za.svg" },
  "ke": { "name": "Kenya", "currency": "KSh", "flag_url": "/assets/flags/ke.svg" },
  "us": { "name": "United States", "currency": "$", "flag_url": "/assets/flags/us.svg" }
}
```

### Country-Specific Module Injectors (`configs/ng.json`, `configs/us.json`)
Instead of hardcoding "exams" or "trivia", the config uses a **schema-less modules array**. If you invent a new content type next year, you just add it here.

**Example: `configs/za.json` (South Africa)**
```json
{
  "country_code": "za",
  "dashboard_modules": [
    {
      "id": "za_nsc",
      "display_name": "NSC Past Papers",
      "renderer": "cbt_engine",         // Tells the UI to use the CBT Player
      "icon": "📚",
      "data_source": "content/exams/za_nsc_index.json"
    },
    {
      "id": "za_history_trivia",
      "display_name": "SA History Trivia",
      "renderer": "trivia_engine",      // Tells the UI to use the Multiplayer Trivia Player
      "icon": "🌍",
      "data_source": "content/trivia/za_history.json"
    }
  ]
}
```

---

## 2. Global University Exam Simulations (Cross-Border Filtering)

A massive feature of this platform is the **Global University Exam Simulations**, designed to support every university in the world, across all academic levels and faculties.

To achieve this without bloating the primary country config files (which would cause massive lag), University Simulations use a highly scalable **Hierarchical Indexing Strategy**.

**How it works in the UI:**
1. The user navigates to the "University Simulations" tab.
2. The UI fetches `configs/universities_global_index.json` to populate a "Filter by Country" dropdown.
3. Upon selecting "USA" and then "Harvard University", the UI fetches the specific exam index for that university and builds the available courses and levels (e.g., Year 1, Year 2).

**The Global University Index (`configs/universities_global_index.json`)**
This lightweight file acts as the master directory for the global filtering system.
```json
{
  "us": {
    "country_name": "United States",
    "universities": [
      {
        "uni_id": "us_harvard",
        "name": "Harvard University",
        "data_source": "content/university/us/harvard_index.json"
      },
      {
        "uni_id": "us_mit",
        "name": "Massachusetts Institute of Technology (MIT)",
        "data_source": "content/university/us/mit_index.json"
      }
    ]
  },
  "ng": {
    "country_name": "Nigeria",
    "universities": [
      {
        "uni_id": "ng_unilag",
        "name": "University of Lagos",
        "data_source": "content/university/ng/unilag_index.json"
      }
    ]
  }
}
```

**University Specific Index (`content/university/us/harvard_index.json`)**
Once a user clicks on a specific university, this file is downloaded. It defines the available exams, separated by faculty and level. Notice it still maps to the universal `cbt_engine`, meaning your existing test player perfectly renders a Harvard exam without any code changes!
```json
{
  "uni_id": "us_harvard",
  "faculties": [
    {
      "name": "Computer Science",
      "levels": [
        {
          "level_name": "Year 1 (Freshman)",
          "exams": [
            {
              "id": "us_harvard_cs50",
              "display_name": "CS50 Introduction to Computer Science",
              "renderer": "cbt_engine",
              "data_source": "content/university/us/harvard/cs50_2025.json"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 3. The Universal Schema (Infinite Extensibility)

To ensure you can add *any* type of exam question in the future without breaking the architecture, we enforce a strict, universal JSON schema for all questions globally. SAT Math, WAEC Physics, and Kenyan KCSE all map to this exact same schema.

**The Unified Question Schema (`unified_schema_v1`)**
```json
{
  "question_id": "sat_math_2026_q1",
  "content_type": "multiple_choice",  // Can be "boolean", "short_answer", "essay"
  "question_text": "Solve for x: 2x + 4 = 10",
  "media_url": null,                  // Supports images/diagrams natively
  "options": [
    { "id": "A", "text": "2" },
    { "id": "B", "text": "3" },
    { "id": "C", "text": "4" }
  ],
  "correct_option_id": "B",
  "deep_analysis": {
    "explanation": "Subtract 4 from both sides to get 2x = 6. Divide by 2 to get x = 3.",
    "topic_tags": ["Algebra", "Linear Equations"]
  }
}
```
*Why this is a million-dollar design:* If an exam body introduces a new question type (like "Fill in the blank"), you just add `"content_type": "short_answer"` to the JSON. The `cbt_engine` reads the `content_type` and renders a text box instead of radio buttons.

---

## 4. The Decoupled UI (The Render Engines)

Your HTML/JS application is essentially an empty shell with "Engines".

1. **The Routing Engine (`index.html`)**: Reads `active_country`, fetches the country config, and draws the dashboard buttons.
2. **The CBT Engine (`cbt_player.html`)**: When a user clicks an exam button, this engine mounts. It downloads the Unified Question Schema JSON, parses the `content_type`, and renders the test. It handles timers and scoring universally.
3. **The Flashcard Engine (`flashcard_player.html`)**: Renders swipeable cards based on any dataset passed to it.

---

## 5. The Global State Manager (MongoDB Atlas)

Because a single user might travel, study abroad, or switch from WAEC to SAT, the database must track progress agnostic of the country. Progress is strictly tied to the `module_id`.

**User Document:**
```json
{
  "_id": "user_999",
  "email": "student@example.com",
  "active_country": "ke",          
  "wallet_balance": 1500,          // Managed by your backend
  "progress_map": {
    "ke_kcse_math": { "high_score": 88, "mastery_level": "Expert" },
    "us_sat_math": { "high_score": 750, "mastery_level": "Advanced" },
    "us_harvard_cs50": { "high_score": 95, "mastery_level": "Expert" }
  }
}
```

## Verification Plan & Rollout

1. **Standardize the Data:** We will build a Python converter script that takes your existing Nigerian databases and your US databases, and converts them both strictly into the **Unified Question Schema**.
2. **Setup the Edge Network:** We will provision the Cloudflare R2 bucket with the exact folder structures for `configs/` and `content/`.
3. **Build the Shell:** We will strip the hardcoded country data out of your HTML dashboard and wire it up to the `Routing Engine` to dynamically read the JSON configs.
