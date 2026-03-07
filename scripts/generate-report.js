const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak, TabStopPosition, TabStopType,
  convertInchesToTwip, Footer, Header, PageNumber, NumberFormat
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────────────────────

const BLUE = "2563EB";
const DARK = "1E293B";
const GRAY = "64748B";
const LIGHT_BLUE_BG = "EFF6FF";
const WHITE = "FFFFFF";
const BLACK = "000000";
const TABLE_HEADER_BG = "1E40AF";

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22,
        color: level === HeadingLevel.HEADING_1 ? BLUE : DARK,
        font: "Segoe UI",
      }),
    ],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing ?? 120 },
    alignment: opts.alignment,
    children: [
      new TextRun({
        text,
        size: opts.size ?? 21,
        color: opts.color ?? "333333",
        font: opts.font ?? "Segoe UI",
        bold: opts.bold ?? false,
        italics: opts.italics ?? false,
      }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [
      new TextRun({ text, size: 21, color: "333333", font: "Segoe UI" }),
    ],
  });
}

function boldBullet(label, value, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + " ", size: 21, color: DARK, font: "Segoe UI", bold: true }),
      new TextRun({ text: value, size: 21, color: "333333", font: "Segoe UI" }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: TABLE_HEADER_BG },
    borders: cellBorder,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: "Segoe UI" })],
      }),
    ],
  });
}

function dataCell(text, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    borders: cellBorder,
    children: [
      new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text,
            size: opts.size ?? 20,
            color: opts.color ?? "333333",
            font: opts.font ?? "Segoe UI",
            bold: opts.bold ?? false,
          }),
        ],
      }),
    ],
  });
}

function simpleTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, colWidths[i])),
    tableHeader: true,
  });
  const dataRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map((cell, ci) =>
          dataCell(cell, colWidths[ci], { shading: ri % 2 === 1 ? "F8FAFC" : undefined })
        ),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── Document Sections ────────────────────────────────────────────────────────

function buildDocument() {
  const doc = new Document({
    creator: "CASE Team",
    title: "CASE – Comprehensive Project Report",
    description: "Full technical and business report for CASE portfolio platform",
    styles: {
      default: {
        document: {
          run: { font: "Segoe UI", size: 21 },
        },
      },
    },
    sections: [
      // ── Cover Page ──
      {
        properties: { page: { margin: { top: convertInchesToTwip(2), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          emptyLine(), emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: "CASE", size: 72, bold: true, color: BLUE, font: "Segoe UI" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Code. Access. Share. Everywhere.", size: 28, italics: true, color: GRAY, font: "Segoe UI" })],
          }),
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: "Comprehensive Project Report", size: 36, bold: true, color: DARK, font: "Segoe UI" })],
          }),
          emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          para("Version: 1.0.0 (Public Beta)", { alignment: AlignmentType.CENTER, color: GRAY, size: 20 }),
          para("Date: March 2026", { alignment: AlignmentType.CENTER, color: GRAY, size: 20 }),
          para("Prepared by: CASE Development Team", { alignment: AlignmentType.CENTER, color: GRAY, size: 20 }),
          para("Contact: admin.casev1@gmail.com", { alignment: AlignmentType.CENTER, color: GRAY, size: 20 }),
        ],
      },

      // ── Table of Contents ──
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          heading("Table of Contents"),
          emptyLine(),
          ...[
            "1. Executive Summary",
            "2. Project Overview & Working",
            "3. Technology Stack",
            "4. File Structure & Architecture",
            "5. APIs & External Services",
            "6. Functions & Modules Reference",
            "7. Database Schema & Design",
            "8. Security Architecture",
            "9. Deployment & Infrastructure",
            "10. Performance & Load Capacity",
            "11. Design System",
            "12. User Flows",
            "13. Future Monetization Strategies",
            "14. Conclusion",
          ].map((t) => para(t, { size: 22, color: BLUE })),
        ],
      },

      // ── Main Content ──
      {
        properties: {
          page: {
            margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CASE — Comprehensive Project Report | Page ", size: 16, color: GRAY, font: "Segoe UI" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY, font: "Segoe UI" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── 1. Executive Summary ──
          heading("1. Executive Summary"),
          para(
            "CASE (Code. Access. Share. Everywhere.) is a free, modern portfolio management platform designed specifically for students, freshers, and bootcamp graduates. It enables users to build professional portfolios showcasing their projects, certificates, qualifications, and experience — then share them instantly via a unique CASE code, a shareable URL (@username), or a QR code."
          ),
          para(
            "The platform is currently in Public Beta (launched March 1, 2026). It is built as a fully client-side static web application powered by Firebase for authentication and database, Cloudinary for image management, and deployed on Vercel with zero server infrastructure to maintain."
          ),
          emptyLine(),
          heading("Key Metrics at a Glance", HeadingLevel.HEADING_3),
          simpleTable(
            ["Metric", "Value"],
            [
              ["Platform Status", "Public Beta (v1.0.0)"],
              ["Hosting Cost", "$0 (Vercel free tier + Firebase Spark plan)"],
              ["Backend Servers", "0 — fully serverless"],
              ["Auth Methods", "Email/Password + Google OAuth"],
              ["Image Storage", "Cloudinary (free tier: 25 GB)"],
              ["Database", "Cloud Firestore (NoSQL)"],
              ["Total HTML Pages", "10"],
              ["Total JS Modules", "10"],
              ["Total CSS Files", "7"],
            ],
            [50, 50]
          ),
          emptyLine(),

          // ── 2. Project Overview & Working ──
          heading("2. Project Overview & Working"),
          para(
            "CASE solves a real problem: students and early-career professionals often lack a quick, professional way to present their work to recruiters, mentors, and peers. LinkedIn profiles are generic; personal portfolio websites require technical skills and maintenance. CASE bridges this gap."
          ),
          emptyLine(),
          heading("How It Works", HeadingLevel.HEADING_2),
          boldBullet("Step 1 — Sign Up:", "Users create an account using email/password or Google OAuth. They choose a unique username (3–20 chars, lowercase, numbers, underscores). A unique CASE code (e.g., CASE-ABC12) is auto-generated."),
          boldBullet("Step 2 — Build Profile:", "From the dashboard, users upload a profile photo, write a bio (160 chars max), set a role/title, and add social media links (GitHub, LinkedIn, Portfolio, Twitter, Instagram, YouTube, LeetCode, HackerRank, WhatsApp, Telegram)."),
          boldBullet("Step 3 — Add Content:", "Users add projects (with live URLs, tech-stack tags, preview images), certificates (image uploads, max 10), qualifications (degree, institution, year, CGPA), and experiences (role, company, duration, description)."),
          boldBullet("Step 4 — Share:", "Each profile is accessible at /@username. Users share via their CASE code, direct URL, QR code (downloadable), WhatsApp, or email. Anyone can discover profiles by entering a CASE code on the /explore page."),
          emptyLine(),
          heading("Core Value Propositions", HeadingLevel.HEADING_2),
          bullet("Zero technical barrier — no coding, hosting, or domain required"),
          bullet("Professional, unique shareable profile link (case.app/@username)"),
          bullet("CASE codes for instant, link-free discovery"),
          bullet("Complete portfolio: projects, certificates, qualifications, experiences"),
          bullet("One-click sharing via QR, WhatsApp, email, link copy"),
          bullet("100% free — no premium tiers, no limits on core features"),
          emptyLine(),

          // ── 3. Technology Stack ──
          heading("3. Technology Stack"),
          heading("Frontend", HeadingLevel.HEADING_2),
          simpleTable(
            ["Technology", "Version / Details", "Purpose"],
            [
              ["HTML5", "Semantic markup", "Page structure for 10 pages"],
              ["CSS3", "Custom design system", "Styling with CSS variables, animations, responsive media queries"],
              ["JavaScript (ES6+)", "Vanilla JS — no framework", "All client-side logic, DOM manipulation, API calls"],
              ["Google Fonts", "DM Sans, Inter, Syne, JetBrains Mono", "Typography"],
              ["QRCode.js", "CDN (jsdelivr)", "QR code generation for profile sharing"],
            ],
            [25, 35, 40]
          ),
          emptyLine(),
          heading("Backend Services", HeadingLevel.HEADING_2),
          simpleTable(
            ["Service", "Plan / Tier", "Purpose"],
            [
              ["Firebase Authentication", "Spark (free)", "Email/password + Google OAuth sign-in"],
              ["Cloud Firestore", "Spark (free)", "NoSQL document database for all user data"],
              ["Cloudinary", "Free tier (25 GB)", "Image upload, storage, and on-the-fly transformations"],
              ["Vercel", "Hobby (free)", "Static site hosting, URL rewrites, caching, security headers"],
            ],
            [30, 25, 45]
          ),
          emptyLine(),
          heading("Build & Deployment", HeadingLevel.HEADING_2),
          bullet("Build script: scripts/generate-env.js — generates firebase-env.js from Vercel environment variables at deploy time"),
          bullet("No bundler, no build step beyond env generation — pure static files served directly"),
          bullet("Deployment: git push to Vercel → auto-deploy with zero configuration"),
          emptyLine(),

          // ── 4. File Structure & Architecture ──
          heading("4. File Structure & Architecture"),
          para(
            "The project follows a flat, convention-based architecture with clear separation of concerns. All public-facing pages and assets reside in the /public directory."
          ),
          emptyLine(),

          simpleTable(
            ["Path", "Type", "Description"],
            [
              ["index.html", "HTML", "Landing page — hero, features, how-it-works, CTA"],
              ["main.js", "JS", "Landing page controller — particles, animations, scroll reveals, navbar"],
              ["styles.css", "CSS", "Landing page styles (~1200 lines) — design tokens, layout, animations"],
              ["firebase.json", "Config", "Firebase project configuration (Firestore rules path)"],
              ["firestore.rules", "Security", "Firestore security rules — access control for all collections"],
              ["vercel.json", "Config", "Vercel deployment — URL rewrites, caching headers, security headers"],
              ["package.json", "Config", "Project metadata — build script reference"],
              ["scripts/generate-env.js", "Node.js", "Build script — generates firebase-env.js from env vars"],
              ["", "", ""],
              ["public/auth.html", "HTML", "Authentication page — login, signup, password reset, Google OAuth"],
              ["public/dashboard.html", "HTML", "User dashboard — profile editing, project management, CASE code"],
              ["public/explore.html", "HTML", "Profile discovery — enter CASE code to view any profile"],
              ["public/profile.html", "HTML", "Public profile view — rendered portfolio page (/@username)"],
              ["public/about.html", "HTML", "About page — mission, values, team, contact"],
              ["public/blog.html", "HTML", "Blog — articles on portfolio tips, platform updates"],
              ["public/careers.html", "HTML", "Careers — open positions, how to apply"],
              ["public/privacy.html", "HTML", "Privacy Policy — 10-section legal document"],
              ["public/terms.html", "HTML", "Terms of Service — 12-section legal document"],
              ["", "", ""],
              ["public/js/firebase-config.js", "JS", "Firebase SDK initialization (auth + Firestore)"],
              ["public/js/firebase-env.js", "JS", "Auto-generated Firebase config (window.__FIREBASE_CONFIG__)"],
              ["public/js/auth.js", "JS", "Auth service — signup, login, Google OAuth, password reset, auth guards"],
              ["public/js/data-service.js", "JS", "Data CRUD — all Firestore operations for user data"],
              ["public/js/auth-page.js", "JS", "Auth page controller — form handling, validation, card switching"],
              ["public/js/dashboard.js", "JS", "Dashboard controller — sidebar nav, all section management"],
              ["public/js/explore.js", "JS", "Explore page controller — CASE code lookup"],
              ["public/js/profile.js", "JS", "Profile page controller — render public portfolio"],
              ["public/js/cloudinary.js", "JS", "Image upload — profile photos, project previews, certificates"],
              ["public/js/utils.js", "JS", "Shared utilities — toast, clipboard, QR, modals, animations"],
              ["", "", ""],
              ["public/css/shared.css", "CSS", "Shared component styles — buttons, inputs, cards, toasts, modals"],
              ["public/css/auth.css", "CSS", "Auth page styles — form cards, validation feedback"],
              ["public/css/dashboard.css", "CSS", "Dashboard styles (~1900 lines) — sidebar, sections, forms, grids"],
              ["public/css/explore.css", "CSS", "Explore page styles — centered input, error animation"],
              ["public/css/profile.css", "CSS", "Public profile styles — hero, socials, projects, certs grid"],
              ["public/css/pages.css", "CSS", "Static pages styles — about, blog, careers, privacy, terms"],
            ],
            [30, 10, 60]
          ),
          emptyLine(),

          // ── 5. APIs & External Services ──
          heading("5. APIs & External Services"),
          heading("5.1 Firebase Authentication API", HeadingLevel.HEADING_2),
          para("Firebase Auth is used for all user identity management. The SDK is loaded via CDN (v10.14.1 compat mode)."),
          simpleTable(
            ["Method", "Firebase API", "Purpose"],
            [
              ["Email/Password Signup", "createUserWithEmailAndPassword()", "Register new user with email + password"],
              ["Email/Password Login", "signInWithEmailAndPassword()", "Authenticate existing user"],
              ["Google OAuth", "signInWithPopup(GoogleAuthProvider)", "One-click Google sign-in"],
              ["Password Reset", "sendPasswordResetEmail()", "Send password reset link to email"],
              ["Auth State Listener", "onAuthStateChanged()", "Real-time auth state monitoring"],
              ["Sign Out", "signOut()", "Clear user session"],
            ],
            [25, 35, 40]
          ),
          emptyLine(),

          heading("5.2 Cloud Firestore API", HeadingLevel.HEADING_2),
          para("Firestore is used as the primary database. All operations are performed client-side using the Firestore SDK."),
          simpleTable(
            ["Operation", "Firestore Method", "Usage"],
            [
              ["Read Document", "getDoc()", "Fetch user profile, lookup username/CASE code"],
              ["Read Collection", "getDocs() + query()", "Fetch projects, certificates, qualifications, experiences"],
              ["Create Document", "setDoc()", "Create user profile, register username, generate CASE code"],
              ["Update Document", "updateDoc()", "Update profile fields, increment profile views"],
              ["Delete Document", "deleteDoc()", "Delete projects, certificates, qualifications, experiences"],
              ["Atomic Increment", "increment(1)", "Increment profile view counter atomically"],
              ["Ordering", "orderBy('createdAt', 'desc')", "Sort items by creation date (newest first)"],
              ["Offline Persistence", "enableIndexedDbPersistence()", "Cache data locally for offline access"],
            ],
            [20, 35, 45]
          ),
          emptyLine(),

          heading("5.3 Cloudinary Upload API", HeadingLevel.HEADING_2),
          para("Cloudinary is used for all image storage. Images are uploaded client-side using unsigned uploads with an upload preset."),
          simpleTable(
            ["Configuration", "Value"],
            [
              ["Cloud Name", "ds1wxopgy"],
              ["Upload Preset", "Case-V1 (unsigned)"],
              ["API Endpoint", "https://api.cloudinary.com/v1_1/ds1wxopgy/image/upload"],
            ],
            [30, 70]
          ),
          emptyLine(),
          simpleTable(
            ["Upload Type", "Max File Size", "Transformation Applied", "File Types"],
            [
              ["Profile Photo", "5 MB", "w_400,h_400,c_fill,g_face,f_auto,q_auto (face-crop 400×400)", "JPG, PNG, WEBP"],
              ["Project Preview", "8 MB", "w_1200,c_limit,f_auto,q_auto (max 1200px wide)", "JPG, PNG, WEBP"],
              ["Certificate", "8 MB", "w_1200,c_limit,f_auto,q_auto (max 1200px wide)", "JPG, PNG, WEBP (no PDFs)"],
            ],
            [20, 15, 45, 20]
          ),
          emptyLine(),

          heading("5.4 Third-Party CDN Libraries", HeadingLevel.HEADING_2),
          simpleTable(
            ["Library", "Source", "Purpose"],
            [
              ["Firebase SDK v10.14.1", "gstatic.com CDN", "Authentication + Firestore client"],
              ["QRCode.js", "jsdelivr CDN", "QR code generation for profile/CASE code sharing"],
              ["Google Fonts", "fonts.googleapis.com", "DM Sans, Inter, Syne, JetBrains Mono typefaces"],
            ],
            [30, 30, 40]
          ),
          emptyLine(),

          // ── 6. Functions & Modules Reference ──
          heading("6. Functions & Modules Reference"),
          heading("6.1 auth.js — Authentication Service", HeadingLevel.HEADING_2),
          simpleTable(
            ["Function", "Parameters", "Returns", "Purpose"],
            [
              ["onAuthStateChanged(cb)", "callback function", "unsubscribe fn", "Subscribe to auth state changes"],
              ["getCurrentUser()", "—", "User | null", "Get current user synchronously"],
              ["waitForAuth()", "—", "Promise<User|null>", "Wait for auth resolution on page load"],
              ["signUp(email, pwd, name, uname)", "string ×4", "UserCredential", "Email/password signup + Firestore user creation"],
              ["login(email, password)", "string ×2", "UserCredential", "Email/password login"],
              ["signInWithGoogle()", "—", "{user, isNew}", "Google OAuth popup sign-in"],
              ["completeGoogleSignUp(uname)", "string", "void", "Finish Google signup with username"],
              ["logout()", "—", "void", "Sign out"],
              ["resetPassword(email)", "string", "void", "Send password reset email"],
              ["requireAuth()", "—", "void", "Auth guard — redirect if not logged in"],
              ["redirectIfAuth()", "—", "void", "Redirect to dashboard if logged in"],
            ],
            [27, 20, 18, 35]
          ),
          emptyLine(),

          heading("6.2 data-service.js — Firestore Data Layer", HeadingLevel.HEADING_2),
          para("All CRUD operations for user data with session caching. Cache is invalidated on every write mutation."),
          simpleTable(
            ["Function", "Parameters", "Returns", "Purpose"],
            [
              ["getUser()", "—", "User object", "Fetch current user profile (cached)"],
              ["createUser(userData)", "{fullName, username, photoURL?}", "{uid, ...user}", "Create Firestore user doc + username + CASE code"],
              ["updateUser(updates)", "{fullName?, bio?, ...}", "{uid, ...updates}", "Update profile (handles username changes)"],
              ["getProfileCompletion()", "—", "{percent, missing}", "Calculate profile completion %"],
              ["checkUsername(username)", "string", "{available, reason?}", "Validate + check uniqueness"],
              ["incrementViews(uid)", "string", "void", "Atomic profile view increment"],
              ["getProjects()", "—", "Project[]", "Fetch all user projects, ordered by date"],
              ["addProject(project)", "{name, desc, url, ...}", "{id, ...project}", "Create new project"],
              ["updateProject(id, updates)", "string, object", "{id, ...updates}", "Update project"],
              ["deleteProject(id)", "string", "void", "Delete project"],
              ["getCertificates()", "—", "Cert[] (max 10)", "Fetch all certificates"],
              ["addCertificate(cert)", "{name, imageUrl}", "{id, ...cert}", "Add certificate (enforces max 10)"],
              ["deleteCertificate(id)", "string", "void", "Delete certificate"],
              ["getQualifications()", "—", "Qual[] (max 10)", "Fetch all qualifications"],
              ["addQualification(qual)", "{degree, institution, ...}", "{id, ...qual}", "Add qualification"],
              ["updateQualification(id, upd)", "string, object", "{id, ...upd}", "Update qualification"],
              ["deleteQualification(id)", "string", "void", "Delete qualification"],
              ["getExperiences()", "—", "Exp[] (max 10)", "Fetch all experiences"],
              ["addExperience(exp)", "{title, company, ...}", "{id, ...exp}", "Add experience"],
              ["updateExperience(id, upd)", "string, object", "{id, ...upd}", "Update experience"],
              ["deleteExperience(id)", "string", "void", "Delete experience"],
              ["lookupProfile(query)", "string (code/username)", "{found, user?}", "Lookup by CASE code or username"],
              ["getPublicProfile(username)", "string", "{user, projects, ...}", "Full public profile + view increment"],
            ],
            [25, 22, 18, 35]
          ),
          emptyLine(),

          heading("6.3 cloudinary.js — Image Upload", HeadingLevel.HEADING_2),
          simpleTable(
            ["Function", "Max Size", "Transformation"],
            [
              ["uploadProfilePhoto(file, userId)", "5 MB", "400×400 face-crop, auto format/quality"],
              ["uploadProjectPreview(file, userId, projectId)", "8 MB", "1200px max width, auto format/quality"],
              ["uploadCertificateImage(file, userId, certId)", "8 MB", "1200px max width, auto format/quality"],
            ],
            [40, 15, 45]
          ),
          emptyLine(),

          heading("6.4 utils.js — Shared Utilities", HeadingLevel.HEADING_2),
          simpleTable(
            ["Function", "Purpose"],
            [
              ["toast(message, type?, duration?)", "Show notification toast (success/error/info)"],
              ["copyToClipboard(text)", "Copy text to clipboard with fallback"],
              ["initCopyButton(btn, getText)", "Attach copy behavior with '✓ Copied!' feedback"],
              ["generateQR(container, url, size?)", "Generate QR code using QRCode.js"],
              ["animateCount(el, target, duration?)", "Count-up animation for stat numbers"],
              ["staggerReveal(selector, delay?)", "Stagger fade-in animation for grid items"],
              ["sequenceReveal(selectors, delay?)", "Sequential section reveals"],
              ["openModal(modal) / closeModal(modal)", "Modal open/close with body overflow management"],
              ["debounce(fn, ms?)", "Debounce function (used for username validation)"],
              ["escapeHTML(str)", "HTML escape for XSS prevention"],
              ["shareWhatsApp(url, message?)", "Open WhatsApp share dialog"],
              ["shareEmail(url, name)", "Open email compose with pre-filled content"],
            ],
            [40, 60]
          ),
          emptyLine(),

          heading("6.5 Page Controllers", HeadingLevel.HEADING_2),
          simpleTable(
            ["Module", "Page", "Key Responsibilities"],
            [
              ["auth-page.js", "auth.html", "Login/signup form handling, card switching, Google OAuth flow, username validation"],
              ["dashboard.js", "dashboard.html", "Sidebar navigation, 8-section management, project CRUD modal, all forms, QR/sharing"],
              ["explore.js", "explore.html", "CASE code input formatting, profile lookup, redirect"],
              ["profile.js", "profile.html", "Fetch & render public profile, owner detection, scroll animations, cert modal"],
              ["main.js", "index.html", "Particle animation, scroll reveals, entry sequence, navbar interactions"],
            ],
            [20, 20, 60]
          ),
          emptyLine(),

          // ── 7. Database Schema ──
          heading("7. Database Schema & Design"),
          para(
            "CASE uses Cloud Firestore, a NoSQL document database. Data is organized in collections and subcollections with O(1) lookup patterns for performance."
          ),
          emptyLine(),

          heading("7.1 Collections Overview", HeadingLevel.HEADING_2),
          simpleTable(
            ["Collection", "Document ID", "Purpose", "Public Read"],
            [
              ["users", "{uid}", "Main user profile data", "Yes"],
              ["users/{uid}/projects", "{projectId}", "Portfolio projects", "Yes"],
              ["users/{uid}/certificates", "{certId}", "Uploaded certificates", "Yes"],
              ["users/{uid}/qualifications", "{qualId}", "Education history", "Yes"],
              ["users/{uid}/experiences", "{expId}", "Work experience", "Yes"],
              ["caseCodes", "{CASE-XXXXX}", "CASE code → uid lookup", "Yes"],
              ["usernames", "{username}", "Username → uid lookup", "Yes"],
            ],
            [25, 18, 37, 20]
          ),
          emptyLine(),

          heading("7.2 User Document Schema", HeadingLevel.HEADING_2),
          simpleTable(
            ["Field", "Type", "Description"],
            [
              ["fullName", "string", "User's display name"],
              ["username", "string", "Unique username (3–20 chars, a-z, 0-9, _)"],
              ["bio", "string", "Short biography (max 160 characters)"],
              ["role", "string", "Professional role/title"],
              ["photoURL", "string", "Cloudinary URL for profile photo"],
              ["caseCode", "string", "Auto-generated code (e.g., CASE-ABC12)"],
              ["socialLinks.github", "string", "GitHub profile URL"],
              ["socialLinks.linkedin", "string", "LinkedIn profile URL"],
              ["socialLinks.portfolio", "string", "Personal portfolio URL"],
              ["socialLinks.twitter", "string", "Twitter/X profile URL"],
              ["socialLinks.instagram", "string", "Instagram profile URL"],
              ["socialLinks.youtube", "string", "YouTube channel URL"],
              ["socialLinks.leetcode", "string", "LeetCode profile URL"],
              ["socialLinks.hackerrank", "string", "HackerRank profile URL"],
              ["socialLinks.whatsapp", "string", "WhatsApp link"],
              ["socialLinks.telegram", "string", "Telegram link"],
              ["stats.profileViews", "number", "Total profile view count"],
              ["createdAt", "timestamp", "Account creation date"],
              ["updatedAt", "timestamp", "Last profile update date"],
            ],
            [25, 15, 60]
          ),
          emptyLine(),

          heading("7.3 Subcollection Schemas", HeadingLevel.HEADING_2),
          para("Projects Subcollection (users/{uid}/projects/{id}):", { bold: true }),
          simpleTable(
            ["Field", "Type", "Constraints"],
            [
              ["name", "string", "Project name"],
              ["description", "string", "Max 200 characters"],
              ["liveUrl", "string", "Deployed project URL"],
              ["techStack", "string[]", "Array of technology tags"],
              ["previewUrl", "string", "Cloudinary image URL"],
              ["createdAt", "timestamp", "Auto-set on creation"],
              ["updatedAt", "timestamp", "Auto-set on update"],
            ],
            [20, 15, 65]
          ),
          emptyLine(),
          para("Certificates Subcollection (users/{uid}/certificates/{id}):", { bold: true }),
          simpleTable(
            ["Field", "Type", "Constraints"],
            [
              ["name", "string", "Certificate name"],
              ["imageUrl", "string", "Cloudinary image URL (no PDFs)"],
              ["createdAt", "timestamp", "Auto-set on creation"],
            ],
            [20, 15, 65]
          ),
          emptyLine(),
          para("Qualifications (users/{uid}/qualifications/{id}):", { bold: true }),
          simpleTable(
            ["Field", "Type", "Constraints"],
            [
              ["degree", "string", "Degree / certification name"],
              ["institution", "string", "University / institution name"],
              ["year", "string", "Graduation year"],
              ["grade", "string", "CGPA or percentage"],
            ],
            [20, 15, 65]
          ),
          emptyLine(),
          para("Experiences (users/{uid}/experiences/{id}):", { bold: true }),
          simpleTable(
            ["Field", "Type", "Constraints"],
            [
              ["title", "string", "Job title / role"],
              ["company", "string", "Company name"],
              ["duration", "string", "e.g., Jun 2024 – Aug 2024"],
              ["description", "string", "Role description"],
            ],
            [20, 15, 65]
          ),
          emptyLine(),

          heading("7.4 Data Design Patterns", HeadingLevel.HEADING_2),
          boldBullet("O(1) Lookups:", "Dedicated caseCodes and usernames collections act as reverse indexes, enabling instant profile discovery without full-collection scans."),
          boldBullet("Subcollections:", "Projects, certificates, qualifications, and experiences are subcollections under users/{uid}, keeping each user's data isolated and scalable."),
          boldBullet("Session Caching:", "Client-side cache invalidated on every write, reducing redundant Firestore reads within a session."),
          boldBullet("Offline Persistence:", "Firestore IndexedDB persistence enabled — users can browse cached data even without connectivity."),
          emptyLine(),

          // ── 8. Security Architecture ──
          heading("8. Security Architecture"),
          heading("8.1 Firestore Security Rules", HeadingLevel.HEADING_2),
          simpleTable(
            ["Collection", "Read", "Create", "Update", "Delete"],
            [
              ["users/{uid}", "Anyone", "Owner only", "Owner (views: anyone)", "Admin only"],
              ["users/{uid}/projects/*", "Anyone", "Owner", "Owner", "Owner"],
              ["users/{uid}/certificates/*", "Anyone", "Owner", "Owner", "Owner"],
              ["users/{uid}/qualifications/*", "Anyone", "Owner", "Owner", "Owner"],
              ["users/{uid}/experiences/*", "Anyone", "Owner", "Owner", "Owner"],
              ["caseCodes/{code}", "Anyone", "Auth users", "Never", "Never"],
              ["usernames/{username}", "Anyone", "Auth users", "Auth users", "Owner"],
            ],
            [28, 15, 15, 22, 20]
          ),
          emptyLine(),
          heading("8.2 Additional Security Measures", HeadingLevel.HEADING_2),
          bullet("HTTPS enforced on all connections (Vercel default)"),
          bullet("X-Content-Type-Options: nosniff — prevents MIME type sniffing"),
          bullet("X-Frame-Options: DENY — prevents clickjacking"),
          bullet("X-XSS-Protection: 1; mode=block — browser XSS filter enabled"),
          bullet("Referrer-Policy: strict-origin-when-cross-origin — privacy-preserving referrer"),
          bullet("HTML escaping via escapeHTML() utility — prevents stored XSS from user content"),
          bullet("Input validation: username format enforced client-side and server-side (via Firestore rules)"),
          bullet("Cloudinary unsigned uploads scoped to a specific preset with file type + size validation"),
          emptyLine(),

          // ── 9. Deployment & Infrastructure ──
          heading("9. Deployment & Infrastructure"),
          heading("9.1 Hosting: Vercel", HeadingLevel.HEADING_2),
          para("CASE is deployed on Vercel as a static site with zero-configuration continuous deployment."),
          bullet("Auto-deploy on git push — no CI/CD pipeline needed"),
          bullet("Global CDN — content served from edge nodes worldwide"),
          bullet("Automatic HTTPS with TLS 1.3"),
          bullet("Preview deployments for every pull request"),
          emptyLine(),

          heading("9.2 URL Rewriting (Clean URLs)", HeadingLevel.HEADING_2),
          simpleTable(
            ["Clean URL", "Actual File", "Purpose"],
            [
              ["/explore", "/public/explore.html", "Profile discovery page"],
              ["/dashboard", "/public/dashboard.html", "User dashboard"],
              ["/auth, /login, /signup", "/public/auth.html", "Authentication"],
              ["/@:username", "/public/profile.html?u=:username", "Public profile"],
              ["/about", "/public/about.html", "About page"],
              ["/blog", "/public/blog.html", "Blog page"],
              ["/careers", "/public/careers.html", "Careers page"],
              ["/privacy", "/public/privacy.html", "Privacy policy"],
              ["/terms", "/public/terms.html", "Terms of service"],
            ],
            [30, 35, 35]
          ),
          emptyLine(),

          heading("9.3 Caching Strategy", HeadingLevel.HEADING_2),
          simpleTable(
            ["Asset", "Cache Control", "Rationale"],
            [
              ["firebase-env.js", "no-store", "Config can change on redeploy — must never be cached"],
              ["styles.css, main.js", "max-age=31536000, immutable", "Fingerprinted assets — 1 year cache"],
              ["Other CSS/JS", "max-age=3600, stale-while-revalidate=86400", "1hr fresh, 24hr stale — balance freshness and speed"],
              ["HTML files", "no-cache", "Always revalidate — ensures users get latest markup"],
            ],
            [25, 35, 40]
          ),
          emptyLine(),

          // ── 10. Performance & Load Capacity ──
          heading("10. Performance & Load Capacity"),
          para(
            "CASE is architected for cost-efficiency and scalability. As a fully client-side application with no backend servers, load is distributed across managed services."
          ),
          emptyLine(),

          heading("10.1 Firebase Spark Plan Limits", HeadingLevel.HEADING_2),
          simpleTable(
            ["Resource", "Free Tier Limit", "Impact on CASE"],
            [
              ["Firestore Reads", "50,000 / day", "~2,500 full profile views/day (each view ≈ 20 reads)"],
              ["Firestore Writes", "20,000 / day", "~10,000 profile edits/day (each save ≈ 2 writes)"],
              ["Firestore Deletes", "20,000 / day", "~20,000 item deletions/day"],
              ["Firestore Storage", "1 GiB total", "~50,000 user profiles before storage limit"],
              ["Auth Users", "Unlimited", "No limit on registered users"],
              ["Auth Operations", "10,000 / day", "~10,000 logins or signups per day"],
              ["Bandwidth", "360 MB / day", "~3,600 profile loads (100 KB avg response)"],
            ],
            [25, 25, 50]
          ),
          emptyLine(),

          heading("10.2 Cloudinary Free Tier Limits", HeadingLevel.HEADING_2),
          simpleTable(
            ["Resource", "Free Tier Limit", "Impact"],
            [
              ["Storage", "25 GB", "~25,000 profile photos + ~12,500 project/cert images"],
              ["Transformations", "25,000 / month", "25,000 image views with on-the-fly transforms"],
              ["Bandwidth", "25 GB / month", "~125,000 image loads (200 KB avg)"],
            ],
            [25, 25, 50]
          ),
          emptyLine(),

          heading("10.3 Vercel Hobby Plan Limits", HeadingLevel.HEADING_2),
          simpleTable(
            ["Resource", "Free Tier Limit", "Impact"],
            [
              ["Bandwidth", "100 GB / month", "~500,000 full page loads (200 KB avg)"],
              ["Deployments", "Unlimited", "No restriction on deploy frequency"],
              ["Edge Regions", "Global CDN", "Low latency worldwide"],
            ],
            [25, 25, 50]
          ),
          emptyLine(),

          heading("10.4 Estimated Capacity Summary", HeadingLevel.HEADING_2),
          simpleTable(
            ["Scenario", "Daily Users", "Bottleneck", "Solution to Scale"],
            [
              ["Free Tier (current)", "~500–2,000", "Firestore reads (50K/day)", "Upgrade to Blaze plan ($0.06/100K reads)"],
              ["Blaze Plan", "~10,000–50,000", "Cloudinary transforms (25K/mo)", "Upgrade Cloudinary plan ($89/mo for 225K)"],
              ["Full Production", "100,000+", "None (auto-scaling services)", "Firebase + Cloudinary + Vercel Pro all auto-scale"],
            ],
            [20, 18, 30, 32]
          ),
          emptyLine(),
          para("Key Architectural Advantages for Scalability:", { bold: true }),
          bullet("Zero server infrastructure — no servers to scale, patch, or maintain"),
          bullet("All services (Firebase, Cloudinary, Vercel) auto-scale horizontally"),
          bullet("Client-side rendering — no server CPU bottleneck"),
          bullet("Session caching reduces redundant Firestore reads by ~60%"),
          bullet("Offline persistence via IndexedDB reduces network dependency"),
          bullet("CDN-served static assets — global edge caching for sub-100ms TTFB"),
          emptyLine(),

          // ── 11. Design System ──
          heading("11. Design System"),
          heading("11.1 Color Palette", HeadingLevel.HEADING_2),
          simpleTable(
            ["Token", "Value", "Usage"],
            [
              ["Primary Background", "#0F172A", "Page backgrounds (dark navy)"],
              ["Card Background", "#1E293B", "Cards, panels, modals"],
              ["Accent Blue", "#3B82F6", "Primary actions, links, highlights"],
              ["Accent Purple", "#8B5CF6", "Gradient complement, secondary accent"],
              ["Text Primary", "#F1F5F9", "Main text on dark backgrounds"],
              ["Text Muted", "#94A3B8", "Secondary text, labels, hints"],
              ["Border Subtle", "rgba(255,255,255,0.08)", "Card/panel borders"],
              ["Success Green", "#22C55E", "Success states, confirmations"],
              ["Error Red", "#EF4444", "Error states, destructive actions"],
            ],
            [25, 30, 45]
          ),
          emptyLine(),

          heading("11.2 Typography", HeadingLevel.HEADING_2),
          simpleTable(
            ["Font", "Weight", "Usage"],
            [
              ["Syne", "700–800", "Display headlines (64–72px), section headers (40px)"],
              ["DM Sans", "400–500", "Body text (16–18px), form labels, descriptions"],
              ["Inter", "400–600", "UI elements, buttons, navigation"],
              ["JetBrains Mono", "400", "CASE codes, code-related labels, monospace elements"],
            ],
            [25, 15, 60]
          ),
          emptyLine(),

          heading("11.3 Animation Philosophy", HeadingLevel.HEADING_2),
          bullet("Entry sequence: ~3.5s choreographed load (particles → logo → typewriter → hero → interaction)"),
          bullet("Scroll reveals: elements start invisible, slide up 24px with 0.6s ease transition"),
          bullet("Micro-interactions: button hover scale(1.02), card hover translateY(-4px)"),
          bullet("Idle animations: hero mockup floating (6s cycle), particle drift (8–15s cycles)"),
          bullet("Reduced motion: respects prefers-reduced-motion media query"),
          emptyLine(),

          // ── 12. User Flows ──
          heading("12. User Flows"),
          heading("12.1 New User Registration", HeadingLevel.HEADING_2),
          bullet("User lands on homepage (index.html) → clicks 'Get Started'"),
          bullet("Redirected to /auth → chooses email/password or Google sign-in"),
          bullet("For email: enters full name, username (live validation), email, password"),
          bullet("For Google: OAuth popup → if new user, redirected to username picker"),
          bullet("Account created in Firebase Auth → Firestore user doc created → CASE code generated"),
          bullet("Username registered in usernames collection → redirected to /dashboard"),
          emptyLine(),

          heading("12.2 Profile Building", HeadingLevel.HEADING_2),
          bullet("Dashboard loads with profile completion % → user sees missing items"),
          bullet("Edit Profile: upload avatar, set bio (160 chars), role, social links"),
          bullet("Projects: add projects with name, description (200 chars), live URL, tech stack, preview image"),
          bullet("Certificates: upload certificate images (max 10, no PDFs)"),
          bullet("Qualifications: add degree, institution, year, grade/CGPA"),
          bullet("Experiences: add role, company, duration, description"),
          emptyLine(),

          heading("12.3 Profile Sharing & Discovery", HeadingLevel.HEADING_2),
          bullet("User views CASE code on dashboard → copies code or downloads QR"),
          bullet("Share via WhatsApp, email, or direct link copy"),
          bullet("Recipient enters CASE code on /explore → profile found → redirect to /@username"),
          bullet("Public profile page renders: hero, social links, projects, certs, qualifications, experiences"),
          bullet("Profile view counter incremented atomically on each visit"),
          emptyLine(),

          // ── 13. Future Monetization Strategies ──
          heading("13. Future Monetization Strategies"),
          para(
            "CASE is currently 100% free and positioned as a student-first platform. The following monetization strategies are designed to generate revenue without compromising the core free experience."
          ),
          emptyLine(),

          heading("13.1 Freemium Model (Recommended)", HeadingLevel.HEADING_2),
          para("Keep the core product free. Introduce a 'CASE Pro' subscription tier with premium features:", { bold: true }),
          simpleTable(
            ["Feature", "Free Tier", "CASE Pro ($5–8/mo)"],
            [
              ["Projects", "Up to 10", "Unlimited"],
              ["Certificates", "Up to 10", "Unlimited"],
              ["Custom Domain", "Not available", "case.app redirects to yourdomain.com"],
              ["Profile Analytics", "View count only", "Detailed analytics: visitors, referrers, clicks"],
              ["Custom Themes", "Default dark theme", "Light theme, custom colors, font choices"],
              ["Resume/PDF Export", "Not available", "Export portfolio as PDF/resume"],
              ["Priority Badge", "Not available", "'Pro' badge on profile"],
              ["Video Introductions", "Not available", "30-sec video embed on profile"],
              ["Remove 'Built with CASE'", "Always shown", "Optional branding removal"],
            ],
            [25, 30, 45]
          ),
          para("Estimated Revenue: $5/mo × 2% conversion × 10,000 users = $1,000/mo", { italics: true, color: GRAY }),
          emptyLine(),

          heading("13.2 CASE for Teams / Organizations", HeadingLevel.HEADING_2),
          para("Offer 'CASE for Teams' for coding bootcamps, universities, and training institutes:"),
          bullet("Bulk portfolio creation for students"),
          bullet("Admin dashboard for instructors to monitor student profiles"),
          bullet("Custom branding: institution logo, colors, landing page"),
          bullet("Cohort-based portfolio showcases"),
          bullet("API access for integration with LMS platforms"),
          para("Pricing: $10–25/student/semester or $500–2000/year for institution license", { italics: true, color: GRAY }),
          emptyLine(),

          heading("13.3 Recruiter Platform", HeadingLevel.HEADING_2),
          para("Build a recruiter-facing product for discovering talent:"),
          bullet("Searchable candidate directory by tech stack, location, experience level"),
          bullet("Saved candidate lists and comparison views"),
          bullet("Direct messaging to candidates"),
          bullet("Job posting integration"),
          bullet("ATS (Applicant Tracking System) integration"),
          para("Pricing: $49–199/mo per recruiter seat", { italics: true, color: GRAY }),
          emptyLine(),

          heading("13.4 Sponsored / Featured Profiles", HeadingLevel.HEADING_2),
          bullet("Users pay to be 'Featured' on the homepage or explore page"),
          bullet("Bootcamps/courses pay to feature their top graduates"),
          bullet("Non-intrusive — featured section clearly labeled"),
          para("Pricing: $2–10/week for individuals, $50–200/month for institutions", { italics: true, color: GRAY }),
          emptyLine(),

          heading("13.5 Affiliate & Partnership Revenue", HeadingLevel.HEADING_2),
          bullet("Partner with online course platforms (Udemy, Coursera, etc.) — earn affiliate commissions"),
          bullet("Recommend domain registrars for custom domains — affiliate links"),
          bullet("Integrate with hosting platforms (Vercel, Netlify) for premium deployment options"),
          bullet("Promote coding tools and IDEs via contextual recommendations"),
          emptyLine(),

          heading("13.6 API & White-Label Licensing", HeadingLevel.HEADING_2),
          bullet("Offer CASE as a white-label solution for companies wanting internal portfolio tools"),
          bullet("API access for third-party integrations ($29–99/mo based on usage)"),
          bullet("Embed widget: allow users to embed portfolio cards on personal websites/blogs"),
          emptyLine(),

          heading("13.7 Revenue Projection (Year 1)", HeadingLevel.HEADING_2),
          simpleTable(
            ["Stream", "Conservative", "Moderate", "Optimistic"],
            [
              ["CASE Pro Subscriptions", "$6,000/yr", "$24,000/yr", "$60,000/yr"],
              ["CASE for Teams", "$12,000/yr", "$48,000/yr", "$120,000/yr"],
              ["Recruiter Platform", "$0 (not yet built)", "$18,000/yr", "$60,000/yr"],
              ["Featured Profiles", "$2,400/yr", "$12,000/yr", "$36,000/yr"],
              ["Affiliate Revenue", "$1,200/yr", "$6,000/yr", "$18,000/yr"],
              ["Total", "$21,600/yr", "$108,000/yr", "$294,000/yr"],
            ],
            [25, 25, 25, 25]
          ),
          emptyLine(),

          // ── 14. Conclusion ──
          heading("14. Conclusion"),
          para(
            "CASE is a well-architected, lightweight portfolio platform that solves a genuine pain point for students and early-career professionals. Its serverless architecture ensures zero infrastructure maintenance, while managed services (Firebase, Cloudinary, Vercel) provide a scalable foundation that grows with demand."
          ),
          para(
            "The platform's current free-tier infrastructure can comfortably support 500–2,000 daily active users. Upgrading to paid tiers of Firebase (Blaze) and Cloudinary enables scaling to 50,000+ daily users without architectural changes."
          ),
          para(
            "Multiple monetization paths exist — from a straightforward freemium model to B2B offerings for educational institutions and recruiters. The recommended approach is to launch CASE Pro ($5–8/mo) as the first revenue stream while building the recruiter platform as the highest-value long-term opportunity."
          ),
          emptyLine(),
          para("───────────────────────────────────────────", { alignment: AlignmentType.CENTER, color: GRAY }),
          para("CASE — Code. Access. Share. Everywhere.", { alignment: AlignmentType.CENTER, bold: true, color: BLUE, size: 24 }),
          para("admin.casev1@gmail.com", { alignment: AlignmentType.CENTER, color: GRAY, size: 20 }),
        ],
      },
    ],
  });

  return doc;
}

// ── Generate ─────────────────────────────────────────────────────────────────

async function main() {
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "..", "CASE_Project_Report.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Report generated: ${outPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Error generating report:", err);
  process.exit(1);
});
