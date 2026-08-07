"""Deterministic oracle for the WaveformWindow parity tests (Task 6.2).

Emits two fixtures alongside this script:

  ../audio/reference_tone.wav              — 3.000 s of 440 Hz sine, 16 kHz mono, Int16 PCM.
  reference_tone_windows.bin               — five 15,600-sample windows, hop = 7,800,
                                             packed little-endian float32 in [-1.0, 1.0].

The .bin layout is (5 * 15600) contiguous float32 values with no header. The Kotlin/Swift
parity test slides a WaveformWindow over the WAV and asserts MAE <= 1e-6 against this
buffer.

Run with:
    python modules/snoozepulse-audio/__fixtures__/waveform/generate_fixtures.py

The script is deterministic (analytic waveform, no RNG). Re-running is a no-op if the
fixture bytes already match.
"""

from __future__ import annotations

import hashlib
import struct
import wave
from pathlib import Path

import numpy as np

SAMPLE_RATE = 16_000
DURATION_S = 3.0
FREQ_HZ = 440.0
AMPLITUDE = 0.5
PATCH_SAMPLES = 15_600
HOP_SAMPLES = 7_800


def _synthesize_int16() -> np.ndarray:
    """440 Hz sine, half-scale, deterministic across platforms."""
    n = int(round(SAMPLE_RATE * DURATION_S))
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE
    signal_f64 = AMPLITUDE * np.sin(2.0 * np.pi * FREQ_HZ * t)
    return np.round(signal_f64 * 32767.0).astype(np.int16)


def _write_wav(path: Path, samples_int16: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(samples_int16.tobytes())


def _slice_windows(samples_int16: np.ndarray) -> np.ndarray:
    """Match WaveformWindow's contract: sample / 32768.0, no partial trailing window."""
    total = samples_int16.shape[0]
    n_windows = (total - PATCH_SAMPLES) // HOP_SAMPLES + 1
    if n_windows <= 0:
        raise RuntimeError("Reference tone too short for a single window.")
    out = np.zeros((n_windows, PATCH_SAMPLES), dtype=np.float32)
    for i in range(n_windows):
        start = i * HOP_SAMPLES
        out[i] = samples_int16[start:start + PATCH_SAMPLES].astype(np.float32) / 32768.0
    return out


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    root = Path(__file__).resolve().parent
    wav_path = root.parent / "audio" / "reference_tone.wav"
    bin_path = root / "reference_tone_windows.bin"

    samples = _synthesize_int16()
    _write_wav(wav_path, samples)
    windows = _slice_windows(samples)

    bin_path.parent.mkdir(parents=True, exist_ok=True)
    bin_path.write_bytes(windows.astype("<f4").tobytes())

    print(f"WAV   : {wav_path}  ({wav_path.stat().st_size} bytes)  sha256={_sha256(wav_path)}")
    print(f"BIN   : {bin_path}  ({bin_path.stat().st_size} bytes)  sha256={_sha256(bin_path)}")
    print(f"Shape : {windows.shape}  (windows x samples)")
    print(f"Range : min={windows.min():.6f}  max={windows.max():.6f}")


if __name__ == "__main__":
    main()
