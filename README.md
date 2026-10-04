# EMTRIA: Evidence-Grounded Multimodal Traceable Reporting & Intelligence Architecture

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware: RTX 4050 6GB](https://img.shields.io/badge/Hardware-RTX%204050%206GB-green.svg)](https://www.nvidia.com)
[![Status: In Development](https://img.shields.io/badge/Status-Milestone%201%20Planning-orange.svg)](#phased-development-milestones)

---

## 📌 Project Overview

**EMTRIA** (*Evidence-grounded Multimodal Traceable Reporting & Intelligence Architecture*) is a forensic decision-support AI framework designed to analyze preliminary crime-scene evidence across three modalities:
- 📷 **Images**: Crime-scene photography & physical evidence localization.
- 🎥 **Video**: Surveillance / CCTV footage & temporal event keyframe extraction.
- 🎙️ **Audio**: Spoken dialogue, voice notes & emergency call speech transcription.

### Core Mission
> Generate preliminary forensic crime-scene reports in which **every claim presented as an evidence-based finding must be traceable to a corresponding evidence reference**, such as an image bounding box, video timestamp/frame, or audio timestamp.

*EMTRIA is intended to assist forensic investigators during preliminary triage. It does not replace human experts, determine guilt or innocence, or make final legal conclusions.*

---

## 🏛️ System Architecture

\\\
                  ┌──────────────────────────────────────────────┐
                  │              RAW EVIDENCE INPUTS             │
                  │   Images (.jpg/.png) | Video (.mp4) | Audio  │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
      │    IMAGE MODALITY    ││    VIDEO MODALITY    ││    AUDIO MODALITY    │
      │   Florence-2-base    ││   OpenCV Sampling    ││     Whisper-base     │
      │  (Dense description, ││(Frame & timestamp    ││(Speech transcription │
      │   phrase grounding,  ││ extraction ➔ Florence││ with timestamped     │
      │   bounding boxes)    ││ visual evaluation)   ││ speech segments)     │
      └──────────┬───────────┘└──────────┬───────────┘└──────────┬───────────┘
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │                    CANDIDATE OBSERVATIONS LAYER                      │
      │ Status: "candidate_observation" | Bounding Boxes | Segment Timestamps│
      └──────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │             TEMPORAL & CROSS-MODAL CORRELATION LAYER                 │
      │   Aligns video timestamps with audio dialogue; correlates repeated   │
      │   visual entities across photos and frames into coherent sequences.  │
      └──────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │                    STRUCTURED EVIDENCE JSON                          │
      │ Standardized schema: evidence_id, source, location, model confidence │
      └──────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │                  DETERMINISTIC VALIDATION ENGINE                     │
      │ Classifies into: Direct Observation | Cautious Inference | Unverified│
      │ Filters unsupported assumptions without relying on generative AI.    │
      └──────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │               STRUCTURED CLAIMS GENERATOR (Local LLM)                │
      │ Ollama (Llama-3.2-3B) outputs structured JSON:                       │
      │ { claim: string, claim_type: string, evidence_ids: [string] }        │
      └──────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │                   DETERMINISTIC CLAIM CHECKER                        │
      │ Enforces existence, valid schema, and admissible status of cited IDs.│
      │ (Rejects fabricated IDs or claims lacking referenced evidence).      │
      └──────────────────────┬────────────────────────┬──────────────────────┘
                             │                        │
                   [Evidence ID Valid]       [Evidence ID Missing]
                             │                        │
                             ▼                        ▼
      ┌──────────────────────────────┐       ┌──────────────────────┐
      │     REPORT RENDERER & UI     │       │    REJECT / FLAG     │
      │ Renders interactive report:  │       │ Discards unbacked    │
      │ Click citation ➔ jumps to    │       │ claims or marks them │
      │ bounding box or timestamp.   │       │ as unverified.       │
      └──────────────────────────────┘       └──────────────────────┘
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
- **Project**: Third-Year Computer Science Mini-Project
- **Architecture**: EMTRIA v2.1
