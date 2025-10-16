# 🖥️ PC Protection – System Health Monitoring MVP

## 📌 Overview
This project is a **Minimum Viable Product (MVP)** for a system called **PC Protection**, designed as part of a technical assessment.  
It simulates a lightweight system monitoring service and an interactive analytics dashboard.

The solution demonstrates:
- Low-level system metric collection in **C# (.NET 8)**
- Data persistence using **SQLite**
- Web analytics and visualization via **Python Flask + Chart.js**

---

## 🧩 Architecture Overview


PC Protection 
(C# Background Service) 
• Collects CPU, RAM, 
and security events 
• Saves data every 15s 
• Persists to metrics.db 


Analytics Web Server 
(Python Flask API + UI) 
• Serves /api/analytics 
• Returns last 10 metrics 
• Hosts the dashboard page 


Frontend Dashboard 
(HTML + CSS + Chart.js) 
• Displays CPU & RAM chart 
• Auto-refresh every 15s 
• Supports dark mode toggle 


---

## ⚙️ Components

### 🧠 1. PC Protection Service (`/pc_protection/PcProtection`)
- Language: **C# (.NET 8)**
- Purpose: Collects simulated system metrics every 15 seconds.
- Features:
  - Tracks **CPU usage**, **Memory usage**, and **mock security events**.
  - Stores all records in `metrics.db` (SQLite).
  - Configurable sampling rate via `config.json`.

### 🌐 2. Analytics Server (`/analytics_server`)
- Language: **Python 3.11**
- Framework: **Flask**
- Endpoints:
  - `/api/analytics` → Returns last 10 metrics from SQLite.
- Also serves the front-end dashboard.

### 📊 3. Web Dashboard (`/analytics_server/dashboard`)
- Frontend: HTML + CSS + JS (Chart.js)
- Features:
  - Real-time chart (CPU % + Memory MB)
  - Auto-refresh every 15s
  - System health badge (Healthy / Warning / Critical)
  - Dark mode toggle 🌙

---

## 🚀 Local Setup & Run Instructions

### 🧩 Prerequisites
- .NET 8 SDK installed  
- Python 3.11 or higher  
- Flask & Flask-CORS installed  

``bash
pip install flask flask-cors

🧠 Step 1 — Run the PC Protection Service

Open terminal in:
pc_protection_mvp/pc_protection/PcProtection

Run:
dotnet run -c Release

✅ Output will show live metrics and create metrics.db.

🌍 Step 2 — Start Analytics Server

Open terminal in:
pc_protection_mvp/analytics_server

Activate virtual environment (Windows):
.\venv\Scripts\activate.ps1

Run:
python app.py

✅ Server runs at http://127.0.0.1:5000/

📈 Step 3 — Open Dashboard

Visit:
http://127.0.0.1:5000

You’ll see:

-Live chart updating every 15 seconds.
-Health badge (Healthy / Warning / Critical).
-Theme toggle (Light/Dark mode).

🌐 Deployment
Netlify (Static Hosting)

1.Build dashboard files under /analytics_server/dashboard.
2.Deploy folder directly to Netlify.
3.Set Flask API (if needed) using Netlify function proxy or Railway.app backend.

Example:
https://pc-protection-dashboard.netlify.app/

🧠 Key Features Recap
Feature	Description
🔁 Real-time metric updates	Every 15 seconds
🧮 SQLite data persistence	Lightweight local DB
📊 Chart.js interactive graph	Dual metric visualization
🌙 Dark mode toggle	Saves preference to localStorage
📱 Responsive layout	Works on desktop & mobile
⚙️ Configurable sampling	via config.json
💾 Structured data API	REST endpoint /api/analytics

🧰 Tech Stack

Backend: C# (.NET 8), Python (Flask)

Frontend: HTML5, CSS3, JavaScript (Chart.js)

Database: SQLite

Hosting: Netlify (Dashboard), Local Flask (API)

🧑‍💻 Author

Tarush Batra
Software Developer | Cloud & ML Enthusiast
📧 tarushbatra11318@gmailcom
🌐 https://www.linkedin.com/in/tarush-batra-050569272/
