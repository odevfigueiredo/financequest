<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:10B981,100:0F766E&height=190&section=header&text=Finance%20Quest&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Gamified%20Financial%20Education%20for%20Mobile&descAlignY=58&descSize=17" />

<div align="center">
  <p><a href="./README.md">🇧🇷 Leia em Português</a></p>

  <p><strong>Gamified educational app for learning investments, organizing contributions, and evolving through missions.</strong></p>

  <p>
  <img src="https://img.shields.io/badge/Status-Educational_App-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Category-FinEdTech-0F766E?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Version-1.0.0-065F46?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Platform-Mobile-181717?style=for-the-badge" />
  </p>
</div>

---

## 🎮 About

**Finance Quest** is a gamified educational app that turns investing and personal financial organization into a practical learning journey with missions, XP, items, rarities, and a progression system.

The project helps users log contributions, compare investment classes, review risks, and track their own financial progress through an RPG-inspired mobile experience.

> Educational content only. The app does not recommend buying, selling, or holding any investment.

<div align="center">
  <img src="screenshots/mobile/02-inicio.png" width="260" alt="Finance Quest mobile home screen" />
  <br>
  <sub>Home panel as the visual entry point for the financial journey.</sub>
</div>

---

## ✨ Features

- Profile creation with learning paths
- Educational contribution log with amount, currency, category, and predefined option
- Guides for Tesouro Selic, Tesouro IPCA+, CDB, LCI/LCA, REIT-like funds, stocks, ETFs, BDRs, and pension funds
- Explanations for objective, liquidity, guarantee, costs, risks, and pre-investment checklist
- Assisted OCR to parse receipt text and suggest type, amount, and confidence
- XP, level, total power, missions, and achievements
- Collectible items with rarities, equipment, and multipliers
- Financial arsenal with helmet, shoulders, armor, gloves, amulet, blade, grimoire, boots, and rings
- Profile charts for accumulated evolution, monthly contributions, allocation, risk, concentration, and diversification
- CSV export for validated history
- Local browser persistence via `localStorage`

---

## 🧱 Tech Stack

<div align="center">

<img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=181717" />
<img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
<img src="https://img.shields.io/badge/localStorage-181717?style=for-the-badge&logo=googlechrome&logoColor=white" />

</div>

---

## 📱 Screens

```txt
Mobile
├── Profile Creation
├── Home
├── Learn
├── Validation
├── Items
└── Profile
```

---

## 🗂️ Project Structure

```txt
financequest/
├── assets/
│   ├── audio/
│   ├── icon.png
│   └── splash-icon.png
├── screenshots/
│   └── mobile/
├── scripts/
│   ├── capture-mobile-screenshots.mjs
│   ├── logic-smoke.mjs
│   └── serve-dist.mjs
├── src/
│   ├── gameData.js
│   ├── mobileApp.js
│   └── mobileGameLogic.js
├── App.js
├── app.json
└── README.md
```

---

## 🚀 Getting Started

Follow the steps below to run the project locally.

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/odevfigueiredo/financequest.git
cd financequest
npm install
```

### 2. Run the app in the browser
```bash
npm run web
```

### 3. Generate a static build
```bash
npx expo export --platform web --output-dir dist-check --clear
npm run preview:dist
```

---

## 🧪 Tests and QA

```bash
npm run test:logic
npm run screenshots:mobile
```

The smoke test covers currency parsing, OCR/guided analysis, educational guides, drops, equipment, levels, missions, CSV, state migration, and profile analytics.

Mobile screenshots are generated with Android viewport `393x852` and `deviceScaleFactor: 3`, resulting in `1179x2556` images.

---

## 📚 Educational Sources

The explanations were organized from Brazilian references and public financial education materials:

- [CVM / Investor Portal](https://www.gov.br/investidor/pt-br)
- [ANBIMA Como Investir](https://comoinvestir.anbima.com.br/)
- [Tesouro Direto](https://www.tesourodireto.com.br/)
- [Credit Guarantee Fund](https://www.fgc.org.br/sobre-garantia-fgc)
- [Central Bank of Brazil - Financial Citizenship](https://www.bcb.gov.br/cidadaniafinanceira)

---

## 🧭 Roadmap

- More missions by learning profile
- Specific paths for emergency reserve, diversification, and long term
- Educational simulators for interest, liquidity, and risk
- Notifications for periodic portfolio review
- New achievements and equipment sets
- OCR and receipt-reading improvements
- Additional exports beyond CSV

---

## 📸 Preview

### Mobile

<table>
  <tr>
    <td width="33%" align="center">
      <img src="screenshots/mobile/01-criacao-perfil.png" width="100%" alt="Mobile profile creation" />
      <br>
      <sub>Profile Creation</sub>
    </td>
    <td width="33%" align="center">
      <img src="screenshots/mobile/02-inicio.png" width="100%" alt="Mobile home" />
      <br>
      <sub>Home</sub>
    </td>
    <td width="33%" align="center">
      <img src="screenshots/mobile/03-aprender.png" width="100%" alt="Mobile learn" />
      <br>
      <sub>Learn</sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <img src="screenshots/mobile/04-validacao.png" width="100%" alt="Mobile validation" />
      <br>
      <sub>Validation</sub>
    </td>
    <td width="33%" align="center">
      <img src="screenshots/mobile/05-itens.png" width="100%" alt="Mobile items" />
      <br>
      <sub>Items</sub>
    </td>
    <td width="33%" align="center">
      <img src="screenshots/mobile/06-perfil.png" width="100%" alt="Mobile profile" />
      <br>
      <sub>Profile</sub>
    </td>
  </tr>
</table>

---

<div align="center">

Developed by [Jonatha Figueiredo](https://github.com/odevfigueiredo)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F766E,100:10B981&height=120&section=footer" />

</div>
