# TCoVP — dynamic project page

The dynamic TCoVP page lives at `docs/next/`. On the `feat/tcovp-dynamic-showcase` publishing branch, `docs/index.html` is a minimal HTML entry that redirects to `./next/`. It also provides a clickable link that works without JavaScript. The original homepage is preserved byte-for-byte at `docs/original.html`, with its assets and scripts in their existing locations.

## Preview

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open <http://127.0.0.1:8765/> to check the publishing redirect, <http://127.0.0.1:8765/next/> for the new page, or <http://127.0.0.1:8765/original.html> for the preserved original. Serve the whole `docs` directory: the new page reuses figures and the full demonstration video from `docs/assets`. A web server is required for the JSON-driven samples and results.

No build step, framework, analytics, or third-party runtime is required. The page supports mobile layouts, keyboard navigation, reduced-motion preferences, pausable animation, image expansion, sample filtering, evidence-frame seeking, and interactive result tables.

## Content and provenance

- Scientific content, author information, method illustrations, and reported results follow the supplied **Think Visually Across Space and Time: Grounded Reasoning for Video Segmentation** manuscript. The supplied PDF is bundled in `assets/TCoVP_arXiv.pdf`.
- `results-data.json` preserves the four full result tables from the original page. The charts use those reported scores; the GroundMoRe headline comparison uses the same Qwen3-VL-4B backbone.
- `samples-data.json` combines the three original **recorded demonstrations** with saved checkpoint runs on internet clips. All are replayable outputs, not live inference. Sample video time is the replay clock; predicted intervals refer to the labeled source clock. The absence example returns an empty target mask.
- The short clips are crops of the existing `docs/assets/video_demo_with_cover.mp4`: hand-clasp at recording seconds 10–30, store at 48–68, and absence at 94–111.4. Each uses the source video viewport at x=476, y=342, width=1032, height=580. Existing annotations are baked into the source recording. Posters and evidence thumbnails are stills from that recording.
- The hero's animated chain illustrates Figure 1. Its step animation is explanatory and is not synchronized model inference.
- Internet examples include source attribution, a same-clock original/mask switch, the unchanged generated trace, and explicit qualitative limitations. Sanitized run metadata is stored beside the media. Private server paths, credentials, signed download URLs, and shared-training logs are not bundled.
- Fonts (Fredoka, Nunito, and JetBrains Mono) are self-hosted; their OFL license files are in `assets/fonts/`.

The visual direction is inspired by the [Xiaomi-Lens-0 project page](https://seerray-lab.github.io/Xiaomi-Lens-0/): rounded typography, warm colors, outlined panels, and motion. The implementation and TCoVP-specific presentation are independent.

## Internet examples

The 2026-10-19 runs use the existing trained TCoVP Qwen3-VL-4B checkpoint with 16 uniformly sampled reasoning frames, the original action prompt and parser, greedy decoding, and SAM3 box-prompt propagation. Dense frames and exported videos use 15 fps. No manual target box, mask, or expected answer is supplied. Raw and masked views have identical frame counts and clocks. The text shown under **Model trace** is the unedited generated response; explanatory cards and result notes are editorial observations.

The basketball source is [《闪身步》 by 韩波格_](https://www.bilibili.com/video/BV1Ncht6NEnm/), published 2026-09-23. Source attribution and watermarks are retained. Source media remains the creator's work; it is not covered by a license for this project's code. The full remix is a challenge case: the model chooses `defender` but predicts the entire clip as the action interval, inaccurately describes the 13.1 s anchor as a jump, and propagates masks onto unrelated people in tutorial inserts. These errors remain visible. The original clip lasts 24.633313 s; the 370-frame export lasts 24.666667 s, with its last observed frame at 24.6 s.

The **Final shot** example is a separate run on source seconds 20.0–24.633313 of that same video, using the exact same query. It is a continuity diagnostic, not an independent source video or a replacement for the full-remix result. The model selects `player_white`, anchored at excerpt time 1.8 s, with predicted excerpt interval 0.0–3.3 s. The page maps that interval to source seconds 20.0–23.3; the untouched trace retains its excerpt clock. The original parser includes dense frame 50 (3.333 s) at the rounded interval endpoint, then suppresses frames 51–69. The 70-frame export is 4.666667 s long.

These demonstrations have no annotated ground truth or measured accuracy and do not alter the paper's benchmark results. The separately tested cinema clip carries a no-reprint flag and is kept outside this public repository.

## Files

- `index.html`, `style.css`, `app.js`: page, responsive styling, and interactions.
- `samples-data.json`: sample content and replay metadata.
- `results.js`, `results-data.json`: result views and manuscript tables.
- `assets/`: local fonts, PDF, video excerpts, and stills.

## Publishing entry

When GitHub Pages serves `feat/tcovp-dynamic-showcase` from `/docs`, the existing project URL opens `docs/index.html` and redirects to the dynamic page at `next/`. The new page’s original-page link, JavaScript error fallback, and no-JavaScript results link point to `original.html` (with `#results` where appropriate).

`docs/original.html` is byte-for-byte identical to `origin/main:docs/index.html`. The `main` branch is not modified. GitHub Pages source settings are managed separately; these files do not change repository settings.
