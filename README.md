
# 🌒 Octavia LocalIntel

**“Built for Developers” — Prospect smarter, not harder.**

Octavia LocalIntel is a dark-themed, AI-powered web application that helps developers discover local businesses that need digital help—like those with no websites or poor online ratings. Identify leads, visualize data, and export outreach-ready business lists with ease.

---

## 🚀 Features

- 🔍 Find businesses by location, category, and rating
- 🌐 Prioritize those without websites or with low Google ratings
- 💬 Chat-powered interface using Gemini for smart filtering and queries
- 📊 Real-time visualizations (charts, maps, tables)
- 🎨 Dark-mode, noir-style interface built with Tailwind CSS
- 📦 Export filtered business data as CSV/Excel
- 🤖 AI-assisted analysis with smooth split-screen UX

---

## 🧱 Tech Stack

### Frontend
- `React` + `TypeScript`
- `Tailwind CSS` (dark mode default)
- `Framer Motion` for animations
- `Gemini API` for chat interface

### Backend
- `Python` with `FastAPI`
- `Pandas`, `NumPy` for data processing
- `Matplotlib`, `Seaborn`, `Plotly` (dark theme)
- `Serper API` for business data (Google Maps wrapper)

---




cd frontend
npm install
npm run dev

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

###Environment Variables
Create a .env file in the root of each project directory (frontend and backend).

Frontend:

ini
Copy
Edit
VITE_GEMINI_API_KEY=your_gemini_api_key
Backend:

ini
Copy
Edit
SERPER_API_KEY=your_serper_api_key


🎯 Usage
Login or register

Enter a target location (e.g., "Calgary") and optional category

Ask Gemini things like:

"Show me dentists in Calgary with no websites"

"Filter by businesses with ratings below 3.0"

Watch the canvas slide in and data visualizations appear

Export filtered results for cold outreach or lead generation

📦 Export Formats
.csv and .xlsx exports available

Includes: business name, address, contact info, website (if any), rating, hours

✨ Coming Soon
🔐 Auth + account-based usage tracking

📊 Custom lead scoring model

📞 One-click outreach (email/call tools)

📍 Multi-location comparison heatmaps

🧠 Predictive analytics using Gemini AI

🧠 Contributing
Pull requests and issues are welcome!

Fork the repo

Create your feature branch: git checkout -b feature/awesome-feature

Commit your changes: git commit -am 'Add cool feature'

Push to the branch: git push origin feature/awesome-feature

Create a PR ✅

📄 License
MIT — free to use, adapt, and build upon.

🙌 Credits
Built by Simon

Powered by Gemini, Serper, React, and Python

Inspired by real developer pain points and local lead gen strategies



