# BrandGuard - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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