# 🧠 Runes – AI-Powered Learning & Note-Taking Assistant

**Runes** is a smart personal learning assistant designed to help you **capture, organize, and reinforce knowledge** using AI. Whether you're in a lecture, meeting, or deep in a self-study session, Runes transcribes your thoughts, summarizes content, and turns notes into interactive quizzes—keeping your learning flow smooth and productive.

---

## 🚀 MVP Overview

**Runes** is a **web application** that:
- Transcribes live speech into notes using **Whisper API**.
- Summarizes content via **Gemini** or **OpenAI**.
- Auto-generates **quizzes and flashcards**.
- Tracks your **learning progress and insights**.

---

## ✨ Core Features (MVP Scope)

### 1. AI-Powered Note Capture & Organization
- ✅ **Live Transcription** – Real-time voice-to-text using Hugging Face's Whisper API.
- ✅ **Smart Summarization** – AI-generated summaries of lengthy content.
- ✅ **Auto-Categorization** – Auto-tag notes by subject, date, or custom labels.
- ✅ **Searchable Archive** – Retrieve past notes with search & filter tools.
- ✅ **Auto-Tagging** – Categorize notes by topic using basic NLP techniques.

### 2. Interactive Learning System
- ✅ **Quiz Generator** – Generate short quizzes from notes.
- ✅ **Flashcard Mode** – Swipe through flashcards for active recall.
- ✅ **Difficulty Scaling** – AI adjusts quiz complexity based on performance.

### 3. Customization & Exporting
- ✅ **Quiz Settings** – Choose how often and how hard quizzes appear.
- ✅ **Export Notes** – Download as **PDF, Markdown, or Google Docs**.
- ✅ **Copy to Clipboard** – Copy raw and summarized notes easily.

### 4. Notes & Storage
- ✅ **Notes Archive** – Save long-form notes, summaries, and quizzes in Supabase.
- ✅ **Copy Button** – Option to copy both the full notes and summarized versions.
- ✅ **Upload Support** – Users can upload images (graphs, diagrams, etc.) to Supabase.

### 5. User & Settings
- ✅ **User Auth** – Login/Logout (use Firebase Auth).
- ✅ **Settings Panel** – Adjust quiz frequency, summarization toggle.
- ✅ **Export Options** – Export notes to PDF, markdown, or Google Docs.  

---

## 📱 Planned Mobile Expansion (Post-MVP)
- 🔄 Rewrite frontend using **React Native / Flutter / Kotlin**.
- 📲 Publish to personal **Google Play Developer Account**.
- 🔒 Sync user data & authentication via Firebase and Supabase.
- 💸 Add **subscription plan** for premium features:
  - Monthly: `$1.99`
  - Yearly: `$20.99`

### Premium Features
- ✅ **Personalized Dashboard** (Insights per user)
- ✅ **Daily Recaps & Learning Plans**
- ✅ **AI Nudges / Smart Reminders**

---

## 🌟 Future Additions

### Learning Analytics & Daily Recaps
- ✅ **Skill Dashboard** – Track time spent per topic or skill.
- ✅ **Daily/Weekly Recaps** – Summarize your learning and quiz activity.
- ✅ **Reminder System** – Smart nudges for unfinished learning goals.
- 📈 Visual insights with **Chart.js** or **Matplotlib**:
  - Study trends over time.
  - Topic mastery tracking.
  - Quiz accuracy by subject.
  - Personalized recommendations for weak areas.

### Media Upload & Integration
- ✅ **Auto-link media** to note sessions.

### AR Learning Mode (Minimal But Effective)
- ✅ AR Visuals for Key Topics – Small interactive AR experiences for subjects like science & history (e.g., a rotating 3D solar system).
- ✅ Gamified Challenges – Small AR-based pop quizzes (e.g., “Tap the planet with the most moons!”).

---

## 🧩 Pages Needed (MVP)

### 1. Home Page
- Simple overview with CTA: **“Start Taking Notes Now”**.

### 2. Live Lecture Page
- Real-time transcription + summary view.
- View Notes, Take Quiz” button.

### 3. Notes Archive Page
- Filterable & searchable list of past notes.
- Export/download options.

### 4. Notes Page
- View full transcription + summary.
- View media (if any).
- Copy to clipboard.

### 5. Quiz Page
- Auto-generated quizzes with difficulty scaling.
- Flashcard mode + score history.

### 6. Settings Page
- Adjust quiz behavior.
- Toggle recaps/reminders.
- Export all user data.

### 7. Login/Signup Page
- Email-based authentication via Supabase.

---

## 🛠 Tech Stack

### Frontend
- **React + Vanilla CSS**.
- **React Router** – For navigation.
- **Context API or Redux** – For global state (if needed).

### Backend / AI
- **Hugging Face Whisper API/Vosk** – Live transcription.
- **Gemini API / OpenAI API** – Summarization + quiz generation.
- **Mixkit** – Sound effects for quiz interactions.

### Database & Auth
- **Firebase** – Auth, user settings, notes, quizzes, summaries, user metadata..
- **Supabase** – Images.

### Export & Docs
- **Google Docs API** – Export to Google Docs.
- **jsPDF / html2pdf** – For PDF generation.

---
https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API

## 🧪 API Endpoints

| Endpoint         | Description                                  |
|------------------|----------------------------------------------|
| `/transcribe`    | Accepts audio input → returns text.          |
| `/summarize`     | Takes text → returns summarized version.     |
| `/generate_quiz` | Input text → returns MCQs/flashcards.        |
| `/save_note`     | Saves note + summary + tags to DB.           |

---

## 🗃️ Database Schema

### Users
| Field         | Type     | Description                  |
|---------------|----------|------------------------------|
| `id`          | UUID     | Unique user ID               |
| `email`       | String   | User email                   |
| `name`        | String   | User's display name          |
| `created_at`  | Timestamp| Account creation date        |
| `usage_freq`  | Number   | Tracks app usage frequency   |
| `settings`    | JSON     | Quiz freq, preferences       |

### Notes
| Field         | Type     | Description                  |
|---------------|----------|------------------------------|
| `id`          | UUID     | Unique note ID               |
| `user_id`     | UUID     | Linked user ID               |
| `text`        | Text     | Full transcription           |
| `summary`     | Text     | AI summary of the note       |
| `tags`        | Array    | Subject or custom labels     |
| `timestamp`   | Timestamp| When note was created        |

### Quizzes
| Field         | Type     | Description                  |
|---------------|----------|------------------------------|
| `id`          | UUID     | Unique quiz ID               |
| `note_id`     | UUID     | Linked to a note             |
| `questions`   | JSON     | Array of MCQs/flashcards     |
| `score`       | Number   | User score                   |
| `date_taken`  | Timestamp| When quiz was taken          |

### Media (Optional)
| Field         | Type     | Description                  |
|---------------|----------|------------------------------|
| `id`          | UUID     | Unique media ID              |
| `note_id`     | UUID     | Linked to a note             |
| `image_url`   | String   | Supabase file URL            |

---

## 🧠 Target Users
🧑‍🎓 Students & lifelong learners
🧑‍💻 Developers & tech enthusiasts
🧠 Professionals attending lectures, meetings, or conferences

## 📦 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ewa-edun/Runes.git
   cd Runes ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in .env file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the app at `http://localhost:5173`.

---

## 📚 License

MIT License 

## 🤝 Contributing
Want to help improve Runes or contribute AR/AI modules in the future?
Feel free to open a PR or contact me directly!