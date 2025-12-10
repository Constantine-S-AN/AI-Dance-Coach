# Nova AI Dance Coach 🕺🤖

Nova AI Dance Coach is a real-time, browser-based dance coach.

Your webcam feed is analyzed with MediaPipe Pose, a 3D futuristic avatar mimics your moves in a WebGL stage, and Google Gemini Live talks back with short, hype vocal coaching in real time.

> “Sync that rhythm. Execute with precision. Battery at **MAX**.”

---

## ✨ Features

- **Real-time pose tracking**
  - Uses the browser camera + [MediaPipe Pose] loaded from CDN.
  - Extracts key landmarks (head, shoulders, elbows, wrists, hips, knees, ankles).
  - Smooths motion and normalizes scale so Nova stays stable even if you move closer/farther.

- **3D futuristic avatar**
  - Built with **Three.js** + **@react-three/fiber** + **@react-three/drei**.
  - Robot-style skeleton (head, torso, limbs) rendered as glowing cylinders and spheres.
  - Depth estimation logic keeps the avatar grounded to the virtual floor with soft contact shadows.

- **Gemini Live voice coaching**
  - Streams microphone audio to **Gemini Live**.
  - Periodically sends down-sampled video frames (320×240 JPEG) for visual context.
  - Uses a custom system instruction so Nova:
    - Focuses on **flow**, **precision**, and **energy**.
    - Speaks in short, punchy, tech-themed hype lines.
    - Encourages you if you slow down (“Is your battery low?”).

- **Ambient sci-fi UI**
  - “NOVA DANCE AI” header with audio visualizer bars.
  - Status overlays like `INITIATE DANCE`, `CONNECTING TO NEURAL NET…`, `CAM: ACTIVE`, `AI: ONLINE`.
  - Single-click **START SYSTEM** and **Terminate** controls.

---

## 🧱 Tech Stack

- **Frontend:** React (TypeScript) + Vite
- **3D:** three, @react-three/fiber, @react-three/drei
- **AI:** @google/genai (Gemini Live API)
- **Pose tracking:** MediaPipe Pose (loaded globally via CDN)
- **Runtime:** Modern browser with WebGL + camera + microphone

---

## 🗂 Project Structure

```text
.
├── components/
│   ├── CameraFeed.tsx       # Webcam + MediaPipe Pose + frame capture
│   ├── DanceStage.tsx       # 3D scene using react-three-fiber
│   └── DancerAvatar.tsx     # Robot avatar driven by pose landmarks
├── services/
│   └── geminiLiveService.ts # Gemini Live audio + video streaming client
├── App.tsx                  # Main UI, state machine, layout
├── constants.ts             # Colors, model name, system prompt, pose indices
├── types.ts                 # Landmark, PoseResults, GameState, etc.
├── index.html               # Root HTML shell
├── index.tsx                # React entrypoint
├── vite.config.ts           # Vite config
├── package.json
└── metadata.json            # AI Studio metadata (name, description, permissions)
