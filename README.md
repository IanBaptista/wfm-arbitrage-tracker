# WFM Arbitrage Tracker 📈

A high-performance, native-DOM injected Chrome Extension (Manifest V3) engineered to provide real-time arbitrage (spread) analysis for Warframe.Market. 

This project serves as an architectural case study on building resilient browser extensions that interface with heavily guarded Single Page Applications (SPAs), handle third-party API deprecations via Graceful Degradation, and bypass strict CORS/Cloudflare policies using Background Service Workers.

---

## 🎯 The Business Problem
In player-driven economies like Warframe, profit margins (arbitrage) exist between the cost of a complete "Prime Set" and the sum of its individual components. However, calculating this spread manually requires:
1. Searching for multiple individual parts.
2. Cross-referencing lowest online sell orders.
3. Accounting for blueprint multipliers (e.g., dual weapons requiring two blades).

**The Goal:** Eliminate cognitive load by injecting a reactive, real-time calculation widget directly into the host website's UI, updating seamlessly as the user navigates the market.

---

## 🛠️ Tech Stack & Architecture
* **Frontend UI:** React 18 (Hooks, State Management)
* **Language:** TypeScript (Strict Typing)
* **Build Tooling:** Vite + `@crxjs/vite-plugin`
* **Extension API:** Chrome Manifest V3 (Service Workers, Storage, Runtime Messaging)
* **External APIs:** Warframe.Market API V2, WarframeStat API

---

## 🧠 Engineering Challenges & Solutions

### 1. The SPA Lifecycle & DOM Injection
**Problem:** Warframe.Market is a React Single Page Application. Traditional content scripts that run on `window.onload` break because navigating between items changes the URL but does not trigger a page reload.
**Solution:** Implemented a non-blocking URL polling mechanism (`setInterval` at 500ms) within a custom React Hook in the injected component (`SpreadCard.tsx`). The component mounts once, observes the routing state natively, and triggers API re-fetches only when the item slug changes, ensuring zero memory leaks and a seamless user experience.

### 2. CORS Blockades & Cloudflare Protection
**Problem:** Attempting to `fetch()` market data directly from the injected UI script triggered severe CORS policy violations and Cloudflare rate-limit blocks.
**Solution:** Adopted a **Proxy Pattern** using Chrome's Background Service Worker (`serviceWorker.ts`). The UI component delegates all network requests via `chrome.runtime.sendMessage`. The Service Worker acts with "diplomatic immunity", executing the fetches outside the host's strict Content Security Policy (CSP) and returning the sanitized payload to the UI.

### 3. API Deprecation & "The Multiplier Bug"
**Problem:** The legacy API (V1) provided crucial data regarding how many parts a specific Set required (`quantity_for_set`). The modern, enforced API (V2) uses an array of UUIDs but omits the quantity multiplier. This caused calculations for dual weapons (e.g., *Fang Prime*, requiring 2x Blades) to return incorrect spreads.
**Solution: Static Lookup Table (Hardcoding for Graceful Degradation).** Instead of relying on unstable legacy endpoints, we implemented a robust Dictionary/Hash Map pattern (`PART_MULTIPLIERS`) directly within the business logic (`marketService.ts`). 
* The engine resolves standard sets dynamically using V2.
* For complex sets, it intercepts the request, applies predefined exact multipliers, and executes parallel API calls. This guarantees 100% mathematical accuracy without sacrificing the speed of the V2 endpoints.

### 4. UI State Machine vs. Binary Failures
**Problem:** Initially, if a single component of a Set had no active online sellers, the `Promise.all` resolution would return `0`, causing the entire UI to crash or display a generic "No data" error.
**Solution:** Engineered a robust **State Machine**. The engine now calculates exactly how many parts are missing and categorizes the data into four strictly typed UI states:
* `'full'`: Reliable spread calculation (all parts available).
* `'setOnly'`: Set is available, but parts are missing (displays missing fraction, e.g., "1/3 parts missing").
* `'partsPartial'`: Some parts available, but the Set is not.
* `'none'`: Complete market unavailability.

---

## 📂 Core Project Structure

* `src/api/marketService.ts`: The analytical brain. Contains the data fetching logic, the Multiplier Hash Map, and the State Machine evaluator. Strictly decoupled from any visual rendering.
* `src/background/serviceWorker.ts`: The network proxy. Handles message passing, avoids CORS, and maintains a "Whitelist" for Evergreen Prime items to bypass faulty vaulted status API returns.
* `src/content/SpreadCard.tsx`: The View layer. A strictly reactive React component injected into the host DOM. It reads the State Machine output and renders the appropriate visual feedback (colors, tooltips, partial data warnings).

---

## 🚀 How to Build & Run Locally

1. Clone the repository.
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable **Developer mode** (top right).
6. Click **Load unpacked** and select the generated `dist` folder.
7. Navigate to any Prime Set page on `warframe.market` to see the widget in action.

---
*Disclaimer: This is a third-party open-source portfolio tool built for educational and technical demonstration purposes. It is not officially affiliated with Digital Extremes or Warframe.Market.*
