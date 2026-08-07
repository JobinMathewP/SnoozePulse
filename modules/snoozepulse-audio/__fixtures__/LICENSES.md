# Native Module Assets — Licenses & Attribution

This file records the origin, license, and attribution requirements for every binary
asset bundled inside `modules/snoozepulse-audio/`. See `docs/decisions.md` ADR-27 for the
rules on what may be added here.

## Model Weights

### YAMNet (TFLite, classification variant)

| Field | Value |
| ----- | ----- |
| Bundled at | `android/src/main/assets/yamnet.tflite`, `ios/Resources/yamnet.tflite` |
| Source | TensorFlow Hub — `https://tfhub.dev/google/lite-model/yamnet/classification/tflite/1` |
| SHA-256 | `10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de` |
| File size | 4,126,810 bytes (~3.94 MB) |
| Input | 1-D `float32[15600]` waveform, 16 kHz mono, sample values in `[-1, 1]` |
| Output | `scores` `float32[N, 521]`, `embeddings` `float32[N, 1024]`, `log_mel_spectrogram` `float32[N*96, 64]` |
| Classes used | Index 38 (`Snoring`), Index 41 (`Snort`) from the AudioSet ontology |
| License | Apache License 2.0 |
| Attribution | © Google LLC. Redistributed under the Apache 2.0 license as bundled model weights. |

The pretrained YAMNet weights are released by Google under Apache 2.0 as part of the
`tensorflow/models` repository. This project uses the model as-is (ADR-21); no weights
are retrained, fine-tuned, or otherwise modified.

The Apache 2.0 license text is reproduced in `NOTICES.md` at the repository root.

## Regression Corpus

_(Populated in Task 6.6 per ADR-27.)_

Each audio fixture placed under `__fixtures__/audio/` must be recorded in a table below
with source URL, license, and attribution requirement. Clips whose licenses require
attribution (e.g. CC-BY-4.0) must additionally appear in the repository-root `NOTICES.md`.

| File | Source URL | License | Attribution required |
| ---- | ---------- | ------- | -------------------- |
| _(none yet — Task 6.6)_ | | | |

## Log-Mel Parity Fixtures

_(Populated in Task 6.2 per `docs/testing-strategy.md`.)_

Generated files under `__fixtures__/mel/` are derived from the audio corpus above via
the reference Python front-end. Deriving fixtures does not create new copyrighted work
in most jurisdictions, but the source clip's license still governs redistribution.

| File | Derived from | Notes |
| ---- | ------------ | ----- |
| _(none yet — Task 6.2)_ | | |
