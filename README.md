# 🌿 Climatica — Personal Carbon Footprint Tracker

> **Understand, Track, and Reduce Your Carbon Footprint Through Simple Actions and Personalized Insights.**

Climatica is a beautifully designed, fully client-side web application that empowers individuals to take control of their environmental impact. It combines a smart carbon audit calculator, gamified daily habit tracking, personalized recommendations, and a simulated carbon offset marketplace — all running in the browser with zero backend required.

🌍 **Live Demo**: [View on GitHub Pages](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/)

---

## ✨ Features

### 🧮 Carbon Footprint Calculator
- **4-step guided wizard** covering Transport, Home Energy, Food & Diet, and Consumption Habits.
- **Live ticker** that updates your estimated annual CO₂e footprint in real-time as you adjust sliders and toggle options.
- Emission calculations based on standard **EPA / Greenhouse Gas Protocol** conversion factors.
- Progress is saved to `localStorage` — no re-entry needed on refresh.

### 📊 Interactive Dashboard
- **SVG Donut Chart** breaking down your footprint by category (Transport, Energy, Food, Shopping) with hover-highlight interactions.
- **Stat cards** showing total footprint, offset percentage, and active habit streak.
- **Personalized AI-style Insights**: Identifies your top two CO₂ sources and recommends targeted actions.
- **Action Simulator**: Live sliders that model structural changes (solar panels, commute reduction, diet shift) and instantly project the resulting footprint drop.

### ✅ Gamified Daily Habit Tracker
- **7 pre-built eco-actions** with CO₂ impact labels and XP rewards (e.g., "Ate plant-based today: -3.5 kg CO₂, +25 XP").
- **Custom Habit Creator**: Add your own green actions with difficulty ratings.
- **XP & Level System**: Earn XP for every habit completed. Every 1,000 XP levels you up from Eco-Novice → Planet Guardian.
- **Streak Tracker**: Tracks consecutive active days.
- **6 Unlockable Badges**: Green Starter, First Step, Carbon Defender, Neutrality Pledge, Eco-Champion, Net-Zero Hero.

### 🌳 Carbon Offset Marketplace
- Simulated **certified project marketplace** with photorealistic AI-generated imagery:
  - 🌲 Amazon Canopy Reforestation (Gold Standard Certified)
  - 💨 Kutch Wind Power Project (VCS Certified)
  - 🌊 Great Pacific Ocean Clean-up (Ocean Blue Verified)
- Purchase offset bundles (+0.5t or +1.0t) to work toward carbon neutrality.
- Progress tracked against your calculated footprint.

### 🏆 Carbon Neutral Certificate
- Generate a **personalised, printable Certificate of Carbon Neutrality** once your offsets balance your footprint.
- Clean, elegant design optimized for PDF export via the browser print dialog.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher) — only needed for the local dev server.

### Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Start the lightweight development server
node server.js

# 3. Open in your browser
# → http://localhost:3000
```

> **No npm install needed!** The server uses only Node.js built-in modules (`http`, `fs`, `path`).

---

## 🗂️ Project Structure

```
climatica/
├── index.html          # Main SPA layout and all section structures
├── style.css           # Full design system (CSS variables, glassmorphism, animations)
├── app.js              # Application orchestrator: routing, state, toast engine
├── calculator.js       # Carbon audit wizard logic & emission formula engine
├── dashboard.js        # SVG chart renderer, insights generator & action simulator
├── habits.js           # Habit tracker, XP/level system, badges & streaks
├── offsets.js          # Offset marketplace, purchase tracking & certificate renderer
├── server.js           # Lightweight static file dev server (native Node.js)
└── assets/
    ├── amazon_reforestation.png
    ├── wind_turbines.png
    └── ocean_cleanup.png
```

---

## 🧮 Carbon Calculation Model

Emissions are calculated using the following simplified Greenhouse Gas Protocol approach:

| Category | Calculation |
|----------|-------------|
| **Transport** | `(Weekly km × 52 × 0.00018 × Engine Factor) + (Flight hrs × 0.09)` |
| **Energy** | `Monthly Bill ($) × 12 × 8 kWh/$ × 0.00038 × Tariff Factor` |
| **Food** | `Diet Baseline (tons) + (Food Waste % × 0.006)` |
| **Shopping** | Fixed tier: High `2.5t`, Moderate `1.2t`, Minimalist `0.45t` |

**Engine Factors**: Gasoline `1.0` · Hybrid `0.6` · EV `0.15` · No Car `0.0`  
**Tariff Factors**: Standard Grid `1.0` · Partial Solar `0.5` · Green Tariff `0.05`  
**Diet Baselines**: Meat Lover `3.0t` · Balanced `1.8t` · Vegetarian `1.1t` · Vegan `0.65t`

---

## 🎨 Design System

- **Theme**: Dark-mode first with glassmorphism card surfaces
- **Palette**: Emerald (`#10b981`) · Teal (`#06b6d4`) · Amber (`#f59e0b`) · Rose (`#f43f5e`)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) for headings · [Inter](https://fonts.google.com/specimen/Inter) for body
- **Animations**: Smooth fade-ins, slide-transitions, SVG hover highlights, and toast slide-ins

---

## 💾 Data Persistence

All user data is stored entirely **in the browser** using `localStorage`:
- Calculator selections & annual footprint
- Daily habits state, XP, level, streak, and badges
- Offset purchase totals and certificate holder name

No data is ever sent to any server. Everything stays private on the user's device.

---

## 🌐 Deployment

This is a **fully static application** with no build step required. It can be deployed to any static hosting platform:

- ✅ **GitHub Pages** ← Recommended (this deployment)
- ✅ Netlify (drag-and-drop the folder)
- ✅ Vercel
- ✅ Cloudflare Pages

---

## 📄 License

MIT License — feel free to use, fork, and build upon this project.

---

<div align="center">
  Made with 💚 for the planet.
</div>
