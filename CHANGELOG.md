# BrandGuard - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## [1.3.1] - GTM Sprint: Strategic Partnerships - 2024-07-28

### Added
- **Partnership Prospectus:** Created a comprehensive prospectus targeting professional liability insurance providers (e.g., Hiscox, Next Insurance). This document outlines a strategic partnership based on risk mitigation, co-marketing, and mutual client referrals, establishing a new potential revenue and distribution channel.

---
## [1.3.0] - GTM Sprint: Content & SEO - 2024-07-28

### Added
- **SEO Content Engine:** Implemented a new blog view within the application to host long-form SEO content.
- **First Blog Post:** Published "FTC Disclosure Rules 2024: The Complete Compliance Guide for Brand Partnerships," a comprehensive, 1,500+ word article designed to attract organic traffic for key industry terms and establish thought leadership. The post includes a strong call-to-action to the Public Audit Tool to drive conversions.

---
## [1.2.0] - Go-To-Market Acceleration - 2024-07-27

### Changed
- **Optimized Landing Page Conversion:** Re-wrote the hero section copy based on the Hormozi framework to focus on the core user pain point (fear of fines), directly implementing strategic feedback from market analysis. The new copy strengthens the value proposition for first-time visitors.

### Added
- **Public Audit Tool:** Launched a free, limited-use version of the Greenlight Engine on the landing page. This serves as a powerful, value-first lead magnet, allowing potential users to experience the product's core value instantly, as recommended by market analysis.

---

## [1.1.0] - Project Transparency & Planning - 2024-07-26

### Added
- **Introduced Public Progress Tracking:** Established a more transparent development process to provide stakeholders with clear visibility into project status and priorities.
- **Project Changelog (`CHANGELOG.md`):** This file was created to serve as a permanent, verifiable log of all significant updates, following software development best practices.

---

## [1.0.1] - Beta Preparation - 2024-07-26

### Added
- **Automated Onboarding (`WelcomeGuide`):** Implemented a welcome component for first-time users to provide a one-click example, accelerating time-to-value for beta testers.
- **Vercel Analytics:** Integrated cost-free analytics to track user engagement and feature adoption during the closed beta.

### Fixed
- **Critical PDF Bug:** Refactored the PDF generation function to use a `finally` block, ensuring temporary DOM elements are always removed to prevent memory leaks, even if an error occurs.
- **Analytics Component Type Errors:** Corrected several TypeScript errors in the `Analytics` component related to improper type inference in a `.reduce()` function.

### Changed
- **Engine Efficiency:** Optimized the `analyzePostContent` function in `geminiService` by adding an `isRescan` parameter. This disables the AI's thinking budget on re-scans (after a "Magic Fix"), improving speed and user experience.

---

## [1.0.0] - Project Completion & Stabilization - 2024-07-25

### Added
- **Full Feature Integration:**
  - **Brief Studio:** Fully integrated into the main application, accessible from the header and workspace switcher.
  - **Performance Analytics:** Integrated the `Analytics` component as a main view to provide data-driven insights on compliance history.
- **Automated Test Suite (`run-tests.ts`):** Created a new `npm test` script that runs a suite of static test cases against the live Gemini API to ensure engine reliability and prevent regressions.

### Changed
- **Architectural Refinement:** Lifted `reportHistory` state to the top-level `App` component to enable seamless data sharing between the `Dashboard`, `Analytics`, and `Greenlight Log`, improving data consistency and application structure.
- **UI Enhancements:** Added "Brief Studio" and "Analytics" links to the main `Header` and `WorkspaceSwitcher` for easy navigation.

### Fixed
- **Dashboard Props:** Refactored the `Dashboard` component to be stateless regarding `reportHistory`, receiving data via props to align with the new top-level state management architecture.