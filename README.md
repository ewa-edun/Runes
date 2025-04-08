## **MVP Overview**  
Runes is a **web app** that serves as a **smart personal learning assistant**. It helps users **capture, organize, and reinforce knowledge** through AI-generated **transcriptions, summaries, quizzes, and progress tracking**.  

---

## **Core Features (MVP Scope)**  

### **1. AI-Powered Note Capture & Organization**  
✅ **Live Transcription** – Uses **Whisper API** to convert speech into text in real time.  
✅ **Smart Summarization** – AI-generated **summaries of long lectures or discussions**.  
✅ **Auto-Categorization** – Notes are **sorted by subject, date, or custom tags**.  
✅ **Searchable Archive** – Find past notes quickly.  

### **2. Interactive Learning & Quiz System**  
✅ **Quiz Generator** – AI auto-creates **mini quizzes** from saved notes.  
✅ **Flashcard Mode** – Users can review key concepts **as flashcards**.  
✅ **Difficulty Scaling** – Quiz questions adjust in difficulty based on past performance.  

### **3. Customization & Exporting**  
✅ **Adjust Quiz Settings** – Choose **quiz frequency** (e.g., after every 5 notes).  
✅ **Export Notes** – Save notes as **PDF, Markdown, or Google Docs**.  

Color Scheme: 
White ( #ffffff) and Peach ( #FFE5B4) and ( #f6b092 ) colors
---

## **Pages Needed**  

### **1. Home Page (Landing Page)**  
- Simple **intro**: “Your AI-powered study assistant.”  
- **CTA**: “Start Taking Notes Now.”  

### **2. Live Lecture Page**  
- **Live transcription** via Whisper API.  
- **Summarization panel** shows AI-generated summaries in real time.  
- **Start Quiz** button for quick recall.  

### **3. Notes Archive Page**  
- Displays **past notes** (sorted by **date, topic, or speaker**).  
- **Search bar** to find specific notes.  
- **Export** option.  

### **4. Quiz Page**  
- AI-generated **multiple-choice & flashcard quizzes** based on notes.  
- **Difficulty scaling** (easier questions first, harder if the user improves).  
- **Track past scores**.  

### **5. Settings Page**  
- Adjust **quiz frequency & difficulty**.  
- Enable/disable **daily recap emails**.  
- Export **all notes**.  

### **6. Login/Signup Page**  
- Email-based authentication.  

---

## **Tech Stack (Web App)**  

### **Frontend**  
- **React + Vanilla CSS** (for a clean, responsive UI).  
- **Redux or Context API** (if state management is needed).  

### **Backend**    
- **Whisper API** – AI transcription.  
- **GPT (OpenAI or Local Model) or Gemini** – AI-powered note summarization & quiz generation.  
- **Firebase or PostgreSQL** – User authentication & data storage.  

### **Other Integrations**  
- **Google Docs API** (for exporting notes).  

---

## **Documentation Checklist**  

### **1. Project Overview**  
- Brief on what the app does.  
- Target audience (students, self-learners, professionals).  

### **2. Installation & Setup**  
- How to install dependencies (`npm install`).  
- Running the dev server.  
- API keys & environment variables.  

### **3. API Documentation**  
- **/transcribe** – Accepts audio input & returns text.  
- **/summarize** – AI-generated summary from text.  
- **/generate_quiz** – Returns a quiz based on input text.  
- **/save_note** – Saves user’s note to the database.  

### **4. Database Schema**  
- **Users**: (id, name, email, password)  
- **Notes**: (id, user_id, text, summary, category, timestamp)  
- **Quizzes**: (id, note_id, questions, answers, score, date_taken)  

---

### **Why This Works for the Hackathon**  
✅ **No unnecessary complexity** – Focused on core **AI-powered study automation**.  
✅ **Useful in real life** – Helps **take notes, review, and track progress**.  
✅ **Manageable in 4 days** – No over-engineering (just AI + quiz + storage).  

## Future Additions

 ### **1. Progress Tracking & Daily Recaps**  
✅ **Skill Dashboard** – Tracks **how much you’ve studied & learned** over time.  
✅ **Daily/Weekly Recaps** – Sends a **summary of notes, quiz results, and progress updates**.  
✅ **Reminder System** – Users can **set study reminders** based on topics they want to review.   
    - **Graph of study trends** (e.g., “You studied 5 topics this week”).  
    - Breakdown of **quiz accuracy by subject**.  
    - **Personalized study recommendations** based on weak areas. 
    - **Matplotlib/Chart.js** (for progress tracking graphs).  

