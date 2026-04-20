# Product Requirements Document (PRD): Urban Heat Island Tracker

## 1. Executive Summary
The **Urban Heat Island (UHI) Tracker** is a professional-grade climate forecasting platform designed to visualize and predict extreme thermal anomalies in urban environments. By combining 3D spatial mapping with advanced statistical modeling, the platform provides 15-day outlooks for city officials and residents to mitigate heat-related risks.

---

## 2. Technical Stack

### **Frontend**
- **Framework**: React 19 (Vite)
- **Visualization**: Deck.gl (3D Geo-layers), Recharts (Ensemble Analytics)
- **Styling**: Vanilla CSS (Premium "NASA-grade" glassmorphic UI)
- **Animations**: Framer Motion

### **Backend (Django)**
- **Framework**: Django REST Framework (DRF)
- **Role**: API Orchestration, Data Processing, Statistical Engine.
- **Key Services**:
  - **Prediction Engine**: Holt-Winters Triple Exponential Smoothing + ERA5 Historical Analog Ensemble.
  - **Data Providers**: NASA FIRMS (Hotspots), Open-Meteo (Weather/ERA5), Twitter/X (Community Alerts).

### **Infrastructure**
- **Hosting**: Vercel (Hybrid: Vite Frontend + Python Serverless Functions)
- **CI/CD**: Automatic GitHub deployment.

---

## 3. The Role of Django
Django serves as the "Intelligence Layer" of the application. Unlike simple API proxies, the Django backend:
1.  **State Management**: Orchestrates data from multiple disparate APIs (NASA, Open-Meteo, Twitter).
2.  **Statistical Modeling**: The `PredictionEngine` runs multi-variate time-series analysis (Holt-Winters) on 16-day forecasts.
3.  **Historical Analysis**: Blends current forecasts with **ERA5 Historical Reanalysis** (30+ years of climate data) to compute climatological anomalies (P90/P95 heat thresholds).
4.  **Spatial Computation**: Generates 5x5 monitoring grids and computes UHI offsets per neighborhood.

---

## 4. Key Features

### **4.1. 3D Thermal Scape**
Interactive 3D map using Deck.gl `ColumnLayer` and `HeatmapLayer`.
- **Dynamic Extrusions**: Column height represents the local heat index.
- **Soft Glow Heatmaps**: Visualizes the "Urban Heat Island" effect as a soft, soft thermal gradient.

### **4.2. 15-Day Ensemble Forecast**
Statistical modeling that goes beyond 48-hour "nowcasting":
- **Holt-Winters Smoothing**: Captures diurnal (daily) cycles and multi-day trends.
- **Historical Analog Ensemble**: Finds similar historical heat patterns to refine future trajectories.

### **4.3. Real-Time Hotspot Monitoring**
Integration with **NASA FIRMS (VIIRS/MODIS)**:
- Displays live satellite-detected thermal anomalies (fire/extreme heat) as glowing pulses on the map.

### **4.4. Community News Hub**
Live **Twitter/X** integration fetching local weather discourse, providing "ground truth" human context to the satellite and sensor data.

---

## 5. Roadmap & Future Scope
- **Terrain Mapping**: Full 3D elevation integration for micro-climate analysis (valleys vs. rooftops).
- **Satellite Image Overlay**: NDVI (Normalized Difference Vegetation Index) maps to show the correlation between lack of greenery and high heat.
- **Mobile PWA**: Progressive Web App support for field technicians.
