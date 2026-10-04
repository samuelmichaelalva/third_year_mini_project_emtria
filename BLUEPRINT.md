# Final Master Project Blueprint: Multimodal Evidence-Grounded Crime Report Generation

**Project Category**: Third-Year Mini Project  
**Target Hardware**: Laptop (NVIDIA GeForce RTX 4050 Laptop GPU, 6GB VRAM, 16GB RAM, Windows)  
**Target Budget**: ₹0 (100% Local, Free, and Open-Source)  
**Academic Status**: Blueprint Frozen (v2.1 Final Technical Reference)

---

## 1. Core Mission Statement

> **Core Mission**: Generate preliminary forensic crime-scene reports in which **every claim presented as an evidence-based finding must be traceable to a corresponding evidence reference**, such as an image bounding box, video timestamp/frame, or audio timestamp.

*The system functions as an evidence-grounded decision-support tool for preliminary analysis. It does not replace forensic experts, establish guilt or innocence, or make final legal conclusions.*

---

## 2. The Three Permanent Architectural Tenets

1. **No Evidence Reference $\rightarrow$ No Confirmed Finding**: If an assertion cannot be mapped to a specific candidate evidence coordinate or timestamp, it is systematically rejected.
2. **LLM Generates Language, Not Evidence Truth**: The LLM is restricted to formatting and synthesizing validated structured data into professional prose; it is never allowed to fabricate facts or citations.
3. **Sequential Execution Manages VRAM Risk; No Guaranteed Zero OOM**: Models are loaded, executed, and explicitly offloaded one at a time. This architecture is designed for a 6 GB VRAM constraint, but runtime memory depends on resolution, context, and framework allocators.

---

## 3. End-to-End System Architecture

`
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
`

---

## 4. Modality Component Specifications

| Modality / Step | Primary Tool / Model | Technical Role & Capabilities | Important Academic Boundaries |
| :--- | :--- | :--- | :--- |
| **Image Analysis** | Microsoft Florence-2-base | General visual detection, dense region captioning, OCR, and coordinate bounding boxes ([x1, y1, x2, y2]). | General-purpose VLM; not natively specialized for forensic/blood spatter evidence. Scene categorization is derived programmatically. |
| **Video Processing** | OpenCV + Florence-2-base | Deterministic frame sampling and millisecond timestamp extraction. Selected frames are passed to Florence-2. | OpenCV does not perform semantic event detection by itself. Frame difference / scene-change heuristics can be used to prioritize candidates. |
| **Audio Processing** | OpenAI Whisper-base | Automated Speech Recognition (ASR) providing timestamped speech segments. | Current scope is speech-to-text. It does **not** perform environmental acoustic event detection (gunshots, glass breaks). Non-speech acoustic models (YAMNet/AST) are future extensions. |
| **Correlation** | Python Temporal Matcher | Correlates chronological events across video frames and audio segments into unified timelines. | Prevents treating frames as isolated events. |
| **Report Generation** | Ollama (Llama-3.2-3B) | Transforms validated evidence into a structured claims JSON schema. | Ollama executes locally. Quantized runtime VRAM will be measured during deployment. |
| **Claim Verification** | Deterministic Python Validator | Programmatically verifies that all evidence_ids exist in the validated evidence set and match admissible status. | Enforces structural grounding and eliminates dangling/hallucinated citations. Deep semantic entailment is not guaranteed by the deterministic validator; the system instead enforces structured claim generation and explicit evidence-ID grounding. |

---

## 5. Hardware Strategy (RTX 4050 6GB VRAM)

`
Load Florence-2 ➔ Process Images/Frames ➔ Unload & torch.cuda.empty_cache()
Load Whisper-base ➔ Process Audio ➔ Unload & torch.cuda.empty_cache()
Call Ollama (keep_alive=0) ➔ Generate Claims ➔ Release LLM memory
`

* **Sequential Execution**: Modalities run sequentially to minimize simultaneous GPU memory consumption.
* **Resolution & Context Safeguards**: Image resolution and context sizes will be constrained during batch runs.
* **OOM Reality**: While this strategy substantially reduces VRAM risk to fit the 6 GB capacity, CUDA Out-of-Memory cannot be mathematically guaranteed under all edge conditions and will be benchmarked empirically.

---

## 6. Academic Positioning & Research Gap

* **What NOT to claim**: Do not claim "No one has built AI for crime reporting" (commercial systems like Code Four, Probe, Inferensics, and recent 2025/2026 IEEE/forensic journal papers actively research this).
* **Defensible Contribution**: The project investigates an **evidence-grounded multimodal reporting architecture** in which preliminary forensic claims are strictly tied to localized digital evidence (bounding boxes and timestamps) and passed through a deterministic validation barrier to prevent generative hallucination.

---

## 7. Phased Implementation Milestones

### Milestone 1: Grounded Image Observation Pipeline (EMTRIA-Core)
- Input: Sample crime-scene photos.
- Processing: Florence-2-base extracts candidate detections, bounding boxes, and dense descriptions.
- Output: Standardized Candidate Observation JSON.
- Evaluation: Benchmark on a small reference evaluation set (10–30 test images) to measure detection relevance and coordinate validity. *(Note: Evaluation dataset $\neq$ training dataset; zero training required).*

### Milestone 2: Video Sampling, Audio Timelines & Temporal Correlation
- OpenCV deterministic frame sampling + Whisper-base audio speech segments.
- Temporal correlation engine aligns video moments and spoken dialogue into a unified timeline JSON.

### Milestone 3: Deterministic Rules & Structured LLM Claim Engine
- Python rules engine separates Observations vs. Cautious Inferences vs. Unverified flags.
- Ollama generates Structured Claims JSON.
- Deterministic validator admits or rejects each claim based on citation validity.

### Milestone 4: Interactive Grounded Forensic Dashboard
- Split-screen web interface:
  - Left: Evidence viewer with interactive bounding boxes and video/audio timestamp seek bar.
  - Right: Formatted preliminary forensic report with clickable [EVIDENCE: ID] citations.
- Project documentation, defense PPT, and evaluation report.