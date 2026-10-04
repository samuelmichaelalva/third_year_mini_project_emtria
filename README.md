# EMTRIA: Evidence-Grounded Multimodal Traceable Reporting & Intelligence Architecture

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware: RTX 4050 6GB](https://img.shields.io/badge/Hardware-RTX%204050%206GB-green.svg)](https://www.nvidia.com)
[![Status: In Development](https://img.shields.io/badge/Status-Milestone%201%20Planning-orange.svg)](#-phased-development-milestones)

---

## 📌 Project Overview

**EMTRIA** (*Evidence-grounded Multimodal Traceable Reporting & Intelligence Architecture*) is an AI-assisted forensic decision-support framework designed to analyze preliminary crime-scene evidence across three modalities:
- 📷 **Images**: Crime-scene photography & physical evidence localization.
- 🎥 **Video**: Surveillance / CCTV footage & temporal event keyframe extraction.
- 🎙️ **Audio**: Spoken dialogue, voice notes & emergency call speech transcription.

### Core Mission
> Generate preliminary forensic crime-scene reports in which **every claim presented as an evidence-based finding must be traceable to a corresponding evidence reference**, such as an image bounding box, video timestamp/frame, or audio timestamp.

*EMTRIA is intended to assist forensic investigators during preliminary triage. It does not replace human experts, determine guilt or innocence, or make final legal conclusions.*

---

## 🏛️ System Architecture

\\\mermaid
flowchart TD
    subgraph INPUTS["1. RAW EVIDENCE INPUTS"]
        direction LR
        IMG_IN["📷 Images (.jpg/.png)"]
        VID_IN["🎥 Video (.mp4)"]
        AUD_IN["🎙️ Audio (.wav/.mp3)"]
    end

    subgraph MODALITIES["2. MODALITY ANALYZERS (Sequential Execution)"]
        direction LR
        M_IMG["<b>Image: Florence-2-base</b><br/>• Dense visual captioning<br/>• Phrase grounding<br/>• Bounding box coordinates"]
        M_VID["<b>Video: OpenCV + Florence-2</b><br/>• Deterministic frame sampling<br/>• Timestamp extraction<br/>• Candidate visual analysis"]
        M_AUD["<b>Audio: Whisper-base</b><br/>• Speech-to-text (ASR)<br/>• Timestamped dialogue segments"]
    end

    IMG_IN --> M_IMG
    VID_IN --> M_VID
    AUD_IN --> M_AUD

    M_IMG --> CANDIDATE["<b>3. CANDIDATE OBSERVATIONS LAYER</b><br/>Status: candidate_observation | Coordinates | Timestamps"]
    M_VID --> CANDIDATE
    M_AUD --> CANDIDATE

    CANDIDATE --> CORR["<b>4. TEMPORAL & CROSS-MODAL CORRELATION</b><br/>Aligns video timestamps with audio dialogue & tracks entities"]

    CORR --> EVIDENCE_JSON["<b>5. STRUCTURED EVIDENCE JSON</b><br/>evidence_id • source • location • model confidence"]

    EVIDENCE_JSON --> RULES["<b>6. DETERMINISTIC VALIDATION ENGINE</b><br/>Direct Observations | Cautious Inferences | Unverified Checks<br/>(Filters unsupported assumptions without LLM)"]

    RULES --> LLM["<b>7. STRUCTURED CLAIMS GENERATOR (Local LLM)</b><br/>Ollama (Llama-3.2-3B) outputs structured JSON:<br/>{ claim, claim_type, evidence_ids }"]

    LLM --> CHECKER{"<b>8. DETERMINISTIC CLAIM CHECKER</b><br/>Enforces valid evidence_id existence & schema"}

    CHECKER -->|Valid Citations| REPORT["<b>9. INTERACTIVE FORENSIC REPORT</b><br/>Rendered report with clickable evidence links"]
    CHECKER -->|Missing / Invalid ID| REJECT["<b>REJECT / UNVERIFIED FLAG</b><br/>Discards or flags ungrounded assertions"]

    classDef primary fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef secondary fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#e2e8f0;
    classDef highlight fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5;
    classDef reject fill:#450a0a,stroke:#f87171,stroke-width:2px,color:#fef2f2;
    class INPUTS,MODALITIES secondary;
    class CANDIDATE,CORR,EVIDENCE_JSON,RULES,LLM,CHECKER primary;
    class REPORT highlight;
    class REJECT reject;
\\\

---

## 🔒 Permanent Core Principles

1. **No Evidence Reference $\rightarrow$ No Confirmed Finding**: If a claim cannot be mapped to an \evidence_id\, it is never admitted as a factual observation.
2. **LLM Formats, Never Dictates Truth**: Language models are strictly bound to validated structured evidence.
3. **Observation vs. Inference vs. Conclusion**:
   - **Observation**: Directly confirmed digital evidence with coordinates or timestamps.
   - **Inference**: Plausible context derived from observations, explicitly labeled with uncertainty.
   - **Unverified**: Items requiring chemical, physical, or ballistic laboratory verification.

---

## 💻 Hardware & Execution Strategy (RTX 4050 6GB)

To prevent CUDA Out-of-Memory (OOM) failures under 6GB VRAM, EMTRIA operates under a **Sequential Execution Pipeline**:

\\\
Load Florence-2 ➔ Process Visual Evidence ➔ Unload & Free VRAM
Load Whisper-base ➔ Transcribe Audio ➔ Unload & Free VRAM
Invoke Ollama (keep_alive=0) ➔ Synthesize Claims ➔ Release Memory
\\\

- **Target Laptop**: Acer Predator Helios Neo 16
- **GPU**: NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM)
- **RAM**: 16 GB DDR5
- **Budget**: ₹0 (100% Local & Free / Open-Source)

---

## 🗺️ Phased Development Milestones

- [ ] **Milestone 1: Visual Evidence Grounding Prototype (EMTRIA-Core)**
  - Interactive multi-page dashboard UI (Examiner Login, Cases, Workspace, Hardware Monitor).
  - Florence-2-base visual candidate observation engine with bounding-box extraction.
  - Verification on 10–30 reference crime-scene test images.
- [ ] **Milestone 2: Video Sampling & Audio Timelines**
  - OpenCV deterministic frame sampling + Whisper-base speech transcription.
  - Temporal correlation layer aligning visual events with audio timestamps.
- [ ] **Milestone 3: Deterministic Rules & Local LLM Synthesis**
  - Python rules engine separating Observations vs. Inferences vs. Unverified items.
  - Ollama structured claims generation and deterministic citation validator.
- [ ] **Milestone 4: Interactive Grounded Forensic Dashboard & Academic Defense**
  - Clickable report citations jumping to bounding boxes and video/audio seek times.
  - Project documentation, defense PPT, and evaluation report.

---

## 👥 Academic Context
- **Project**: Third-Year Information Technology Mini-Project
- **Architecture**: EMTRIA v2.1
