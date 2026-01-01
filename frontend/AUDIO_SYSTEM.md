# 🎵 Audio System Overview

This document outlines the implementation, purpose, and benefits of the new **Generative Audio System** used in the Omisha Healthcare application.

## 1. How the Sounds Are Used

We utilize two distinct sounds to manage patient flow and alerts. These sounds are generated programmatically using the **Web Audio API**, ensuring they play instantly without requiring external file downloads.

### 📢 1. The Announcement Sound ("Ding-Dong")
**Context:** **TV Display Page** (Waiting Room Screen)

*   **Trigger:** Plays automatically whenever a doctor clicks **"Call Next Patient"** on their dashboard.
*   **Workflow:**
    1.  Doctor updates the queue status to "In-Cabin".
    2.  Server sends a real-time WebSocket event (`UPDATE`).
    3.  TV Display receives the event.
    4.  **Sound Plays:** A loud, clear two-tone chime rings.
    5.  **Visual Update:** The screen updates to show the new Token Number.
*   **Purpose:** To grab the attention of patients sitting in the waiting area, ensuring they look at the screen when the queue moves.

### 🔔 2. The Notification Sound ("Chime")
**Context:** **Patient Dashboard** (Personal Device)

*   **Trigger:** Plays when a patient's turn is approaching (specifically, when there are **3 or fewer** people ahead of them).
*   **Workflow:**
    1.  App continuously monitors the user's position in the queue.
    2.  Logic checks: `(My Token - Current Token) <= 3`.
    3.  **Sound Plays:** A soft, polite alert chime rings.
    4.  **Visual Alert:** A browser notification or popup appears: *"Only 2 patients ahead! Get ready!"*
*   **Purpose:** To alert patients who might be distracted (looking at their phone, reading) that they need to be ready to enter the cabin soon.

---

## 2. Why We Use This Approach (Technical Benefits)

We replaced traditional MP3 file downloads with **Generative Audio**. Here is why this is superior for your web app:

| Feature | Old Method (MP3 Files) | New Method (Generative Audio) |
| :--- | :--- | :--- |
| **Reliability** | ❌ Prone to **CORB Errors** (Cross-Origin blocking) and 404s if files go missing. | ✅ **100% Reliable**. The sound is created by code, so it never fails to load. |
| **Performance** | ❌ Requires network requests. Slow connections causes delays. | ✅ **Zero Latency**. Instant playback because there is nothing to download. |
| **Maintenance** | ❌ You must manage, host, and path-reference static files. | ✅ **Zero Maintenance**. The "file" is just a utility function in your code. |
| **User Data** | ❌ Consumes user's data plan to download sounds. | ✅ **Zero Data Usage**. No extra bandwidth is used. |

---

## 3. How It Helps Your Web App (Business Value)

### 🚀 Improved Patient Flow
By using distinct audio cues, you reduce the "dead time" between appointments.
*   **Reduced Missed Turns:** Patients are alerted *before* their turn, so they are ready at the door.
*   **Faster Transitions:** The TV chime ensures patients look up immediately, rather than waiting for someone to shout their name.

### 🛡️ Professional & Robust
*   **No Broken Features:** You will never face an issue where the sound stops working because a file was moved or a server went down.
*   **Consistent Experience:** The sound is mathematically identical on every device, ensuring a consistent brand experience whether the patient is on a phone, tablet, or laptop.
