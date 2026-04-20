# 🛰️ Urban Heat Island (UHI) Tracker

**A high-fidelity climate forecasting platform for urban thermal resilience.**

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://urban-heat-island-tracker.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Django](https://img.shields.io/badge/Backend-Django%20REST-092E20?style=for-the-badge&logo=django)](https://www.django-rest-framework.org)
[![Deck.gl](https://img.shields.io/badge/Maps-Deck.gl-blue?style=for-the-badge)](https://deck.gl)

---

## 📽️ Project Vision
The **Urban Heat Island Tracker** transforms complex geospatial and meteorological data into actionable insights. By leveraging NASA's FIRMS satellite data and ERA5 historical reanalysis, it provides city-scale thermal mapping with a 15-day predictive horizon.

### **Key Features**
- **3D Geospatial Map**: Pulse-lit 3D columns and heatmaps visualizing local temperature variances.
- **15-Day Statistical Engine**: Ensemble modeling using Holt-Winters and ERA5 Historical Analogs.
- **Live NASA Hotspots**: Real-time integration of VIIRS satellite thermal anomalies.
- **Social Awareness**: Live Twitter/X community feed for localized weather alerts.
- **NASA-Grade UI**: A premium, glassmorphic dashboard built for high-performance data monitoring.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Deck.gl, Recharts, Framer Motion.
- **Backend**: Django 5.0, DRF (REST Framework).
- **Data Layers**: 
  - **ERA5 Archive**: 30+ years of climate reanalysis data.
  - **Open-Meteo**: High-resolution 16-day forecasts.
  - **NASA FIRMS**: Satellite thermal hotspot monitoring.
- **Deployment**: Vercel (Hybrid Python/Node.js runtime).

---

## 🚀 Getting Started

### **Local Development**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AmazingAkhil07/urban-heat-island-tracker.git
   cd urban-heat-island-tracker
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # atau venv\Scripts\activate pada Windows
   pip install -r requirements.txt
   python manage.py runserver
   ```

### **Deployment (Vercel)**
This project is configured for one-click deployment on Vercel. 
- The `/api` directory acts as a Python serverless bridge to the Django backend.
- Static assets are handled by the Vite build.

**Required Environment Variables**:
- `NASA_FIRMS_MAP_KEY`: Get from NASA FIRMS API.
- `TWITTER_BEARER_TOKEN`: Get from Twitter/X Developer Portal.

---

## 📖 Documentation
For a deep dive into the technical architecture and prediction models, refer to the **[Product Requirements Document (PRD)](./prd.md)**.

---

## 📞 Contact
**AmazingAkhil07** - [GitHub](https://github.com/AmazingAkhil07)
