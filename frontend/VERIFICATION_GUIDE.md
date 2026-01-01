# 🧪 Audio System Verification Guide

Follow these steps to confirm that the new audio system is working correctly.

## ✅ Test 1: The "Ding-Dong" Announcement (TV Display)

**Goal:** Hear the sound when a doctor calls a patient.

1.  **Open Two Browser Tabs:**
    *   **Tab A (Doctor):** Log in as a Doctor (e.g., `doc1@example.com` / `password123`). Go to your **Dashboard**.
    *   **Tab B (TV Display):** Go to the **TV Display Page** (`http://localhost:3000/tv`).

2.  **Action (In Tab A - Doctor):**
    *   Find a patient in the "Waiting" list.
    *   Click the **"Call"** button next to their name.

3.  **Result (In Tab B - TV Display):**
    *   👀 **Visual:** The screen should update to show the new Token Number.
    *   👂 **Audio:** You should hear a clear **"Ding-Dong"** sound immediately.

---

## ✅ Test 2: The "Chime" Notification (Patient Alert)

**Goal:** Hear the sound when your turn is near.

1.  **Open Two Browser Tabs:**
    *   **Tab A (Doctor):** Log in as a Doctor.
    *   **Tab B (Patient):** Log in as a Patient (e.g., `pat1@example.com`). Go to your **Dashboard**.

2.  **Setup:**
    *   Ensure the Patient (Tab B) is in the queue and is **Token #5** (for example).
    *   Ensure the Doctor (Tab A) is currently serving **Token #1**.

3.  **Action (In Tab A - Doctor):**
    *   Keep clicking **"Call Next"** or **"Complete"** to move through the queue.
    *   Move from Token #1 -> #2 -> #3.

4.  **Result (In Tab B - Patient):**
    *   As soon as the doctor calls Token #3 (meaning only #4 is ahead of you), the logic `(5 - 3) = 2` triggers.
    *   👂 **Audio:** You should hear a soft **"Chime"** sound.
    *   👀 **Visual:** A popup or alert should appear saying *"Only X patients ahead!"*

---

## ⚠️ Troubleshooting

If you **don't** hear anything:

1.  **Check Browser Auto-Play:**
    *   Browsers often block sound if you haven't interacted with the page yet.
    *   **Fix:** Click anywhere on the TV Display page once after it loads to "wake up" the audio engine.
2.  **Check Volume:** Ensure your computer volume is up and the tab is not muted.
