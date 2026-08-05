<div align="center">

  <h1>🤖 AI-Powered Grievance Redressal System (IGRS)</h1>
  <p><i>A Next-Generation Citizen Grievance Redressal Platform powered by Gemini AI, NLP, and Predictive Analytics</i></p>

  ![License](https://img.shields.io/badge/License-MIT-green.svg)
  ![Next.js](https://img.shields.io/badge/Next.js-14-black)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
  ![Python](https://img.shields.io/badge/Python-3.10+-blue)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)

</div>

---

## 📌 Overview
Traditional grievance portals feature lengthy forms, slow manual classification, and zero predictive analytics. **IGRS** automates the entire redressal lifecycle:
* **Natural Language Chatbot** for instant submission.
* **Automated Geocoding & Priority Ranking** via Google Gemini.
* **Prophet-based Time Series Models** to forecast future hotspots for local administration.

---

## 📸 Platform Screenshots

| User Chatbot Interface | Admin Analytics Dashboard |
| :---: | :---: |
| ![User Dashboard](https://via.placeholder.com/400x250) | ![Admin Dashboard](https://via.placeholder.com/400x250) |

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Citizen Chatbot / UI] -->|User Input| B[FastAPI Backend]
    B -->|Text Prompt| C[Google Gemini API]
    C -->|Extract Category, Severity, Geo-location| B
    B -->|Save Structured Grievance| D[(PostgreSQL DB)]
    D -->|Real Complaint Data| E[Prophet ML Pipeline]
    E -->|Generate Forecasts & Hotspots| F[Admin Analytics Dashboard]