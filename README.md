# VulnBoard – VAPT Report & Web Dashboard Management

VulnBoard is a lightweight web dashboard to manage VAPT (Vulnerability Assessment & Penetration Testing) engagements and generate **professional, white‑label reports** using standardized frameworks such as **OWASP Top 10** and **PCI DSS**.

## Core Value

This platform automates the heavy lifting:

1. **Instant Templating**  
   Supports multiple security frameworks (e.g., OWASP Top 10, PCI DSS). Templates can be extended to NIST, ISO 27001, internal checklists, etc.

2. **Consistent Quality**  
   Zero template headaches: every report follows the same professional structure. Just plug in findings; VulnBoard handles headings, sections, and formatting.

3. **Focus on Value**  
   Spend your time on remediation strategy and client communication, not on repetitive documentation or copy‑paste work.

---

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Report Format**: Markdown (can be converted to PDF/DOCX using external tools later)

---

## Project Structure

```text
VulnBoard/
  backend/       # REST API for frameworks, templates, report generation
  frontend/      # React dashboard for engagement management & preview
  README.md
```

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Run in development mode

```bash
npm run dev
```

Backend default port: **http://localhost:4000**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Run in development mode

```bash
npm run dev
```

Frontend will start (by default) on **http://localhost:5173** and talk to the backend at `http://localhost:4000/api`.

If you change backend URL/port, update `API_BASE` in `frontend/src/App.tsx`.

---

## Quick Usage

1. Start **backend**.
2. Start **frontend**.
3. Open `http://localhost:5173` in your browser.
4. Isi:
   - Client Name
   - Project Name
   - Scope, Testing Type, Methodology
5. Pilih **Framework** (misal: OWASP Top 10 2021).
6. Pilih **Template** (Executive summary / PCI DSS report).
7. Masukkan findings dengan format sederhana:

   ```text
   title|severity|controlId|description

   Contoh:
   SQL Injection on login|High|A03|SQL injection via ' OR 1=1--
   Weak TLS configuration|Medium|A02|Outdated TLS version and weak ciphers
   ```

8. Klik **Generate Report** → preview akan muncul dalam format Markdown di sisi kanan, siap di‑export atau dikonversi ke PDF/DOCX.

---

## Next Improvements (Ideas)

- Authentication & multi‑tenant (per consultant / per company).
- Integration with vulnerability scanners (Burp, ZAP, Nikto, Nmap) untuk auto‑import findings.
- PDF / DOCX export langsung dari UI.
- Multi‑language (EN/ID) dan multi‑brand (logo & header per client).
- Role‑based access control untuk tim VAPT besar.

Happy hacking with **VulnBoard**! 🚀
