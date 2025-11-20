
# BrandGuard Manual Test Plan

This document outlines the specific manual tests required to verify the core features of BrandGuard that depend on real browser APIs and backend services.

## 1. Image Post Upload & Scan

**Objective:** Verify that a user can upload an image, scan it with a caption, and receive a compliance report.

**Steps:**
1.  Navigate to the **Dashboard**.
2.  Click the **"Image Post"** tab.
3.  Enter a caption in the text area: `Testing my new sneakers! #summer` (Intentionally omit `#ad`).
4.  Click **"Upload Image"** or drag and drop a `.png` or `.jpg` file into the upload zone.
5.  Verify the image preview appears.
6.  Click **"Scan Image & Caption"**.
7.  **Expected Result:**
    *   Loader appears ("Analyzing Image...").
    *   A **Greenlight Report** is generated.
    *   The report should likely show a **FAIL** or **WARN** status due to missing FTC disclosure (`#ad`).
    *   The image should be visible in the report card.

## 2. Video Post Upload & Scan

**Objective:** Verify video transcription and multimodal compliance analysis.

**Steps:**
1.  Navigate to the **Dashboard**.
2.  Click the **"Video Post"** tab.
3.  Click **"Select & Analyze Video"**.
4.  Select a short video file (`.mp4`, `.webm`).
5.  **Expected Result:**
    *   The video player loads the file.
    *   The status changes to "Transcribing...".
    *   A text transcript appears in the "Generated Transcript" box.
    *   The status changes to "Analyzing Video...".
    *   A **Greenlight Report** is generated based on both the visual and audio content.

## 3. Brief Studio Generation

**Objective:** Verify the AI generation of a creative brief.

**Steps:**
1.  Navigate to the **Brief Studio** (via Header or Workspace Switcher).
2.  Fill in the inputs:
    *   **Product:** `Neon Energy Drink`
    *   **Message:** `Keeps you awake for gaming marathons.`
    *   **Audience:** `Gamers aged 18-24`
3.  Click **"Generate Greenlight Brief"**.
4.  **Expected Result:**
    *   Loader appears ("Brief Architect is on the job...").
    *   A structured brief appears containing "Key Do's", "Key Don'ts", and a "Compliant Example Post".

## 4. Image Studio Generation

**Objective:** Verify AI image generation and integration with the Dashboard.

**Steps:**
1.  Navigate to the **Image Studio**.
2.  Enter a prompt: `A futuristic cyberpunk coffee shop`.
3.  Click **"Generate"**.
4.  **Expected Result:**
    *   An image is generated and displayed.
5.  Click **"Send to Compliance Dashboard"**.
6.  **Expected Result:**
    *   Redirects to Dashboard.
    *   "Image Post" tab is active.
    *   The generated image is pre-loaded.
    *   The caption input is focused.

## 5. Batch Mode Workflow

**Objective:** Verify bulk processing of multiple assets.

**Steps:**
1.  Navigate to the **Dashboard**.
2.  Select **"Image Post"**.
3.  Toggle **"Batch Mode"** switch to ON.
4.  Enter a **Campaign Name**: `Batch Test Q3`.
5.  Enter a generic caption: `#ad Checking out these new styles.`.
6.  **Click the dashed drop zone** to open the file picker (or drag files).
7.  Select 3 different image files.
8.  **Expected Result:**
    *   Files appear in the "Greenlight Queue" list.
    *   Status updates from "Queued" -> "Running" -> "Complete" sequentially.
    *   Clicking "View Report" on a completed item opens the historic report.

## 6. Download Certificate

**Objective:** Verify PDF generation.

**Steps:**
1.  Open any completed **Greenlight Report** on the Dashboard.
2.  Click the **"Download Certificate"** button (bottom of the card).
3.  **Expected Result:**
    *   Button text changes to "Generating...".
    *   A PDF file named `BrandGuard-Certificate-....pdf` is downloaded.
    *   Open the PDF and verify it contains the score, summary, and check details.

## 7. Quick Scan vs. Scan Post

**Objective:** Verify the shortcut functionality.

**Steps:**
1.  Navigate to **Dashboard** -> **Text Post**.
2.  Enter text: `Just a test post.`
3.  **Action A:** Click the main **"Scan Post"** button.
    *   **Result:** Scans using the Campaign Name (if entered).
4.  **Action B:** Click **"Quick Scan"** (or press `Cmd+Enter`).
    *   **Result:** Scans immediately, ignoring/clearing the Campaign Name field for a rapid check.
