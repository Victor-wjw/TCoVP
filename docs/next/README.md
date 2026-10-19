# TCoVP — dynamic project page

An additive redesign at `docs/next/`. The original project page and its assets are unchanged. This branch does not change GitHub Pages configuration or replace the existing homepage.

## Preview

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open <http://127.0.0.1:8765/next/>. Serve the whole `docs` directory: the new page reuses figures and the full demonstration video from `docs/assets`. A web server is required for the JSON-driven samples and results.

No build step, framework, analytics, or third-party runtime is required. The page supports mobile layouts, keyboard navigation, reduced-motion preferences, pausable animation, image expansion, sample filtering, evidence-frame seeking, and interactive result tables.

## Content and provenance

- Scientific content, author information, method illustrations, and reported results follow the supplied **Think Visually Across Space and Time: Grounded Reasoning for Video Segmentation** manuscript. The supplied PDF is bundled in `assets/TCoVP_arXiv.pdf`.
- `results-data.json` preserves the four full result tables from the original page. The charts use those reported scores; the GroundMoRe headline comparison uses the same Qwen3-VL-4B backbone.
- `samples-data.json` describes three **recorded demonstrations**, not live inference. Sample video time is the replay clock; predicted intervals refer separately to the original scene clock. The absence example returns an empty target mask.
- The short clips are crops of the existing `docs/assets/video_demo_with_cover.mp4`: hand-clasp at recording seconds 10–30, store at 48–68, and absence at 94–111.4. Each uses the source video viewport at x=476, y=342, width=1032, height=580. Existing annotations are baked into the source recording. Posters and evidence thumbnails are stills from that recording.
- The hero's animated chain illustrates Figure 1. Its step animation is explanatory and is not synchronized model inference.
- No private server paths, credentials, or additional remote research outputs are bundled.
- Fonts (Fredoka, Nunito, and JetBrains Mono) are self-hosted; their OFL license files are in `assets/fonts/`.

The visual direction is inspired by the [Xiaomi-Lens-0 project page](https://seerray-lab.github.io/Xiaomi-Lens-0/): rounded typography, warm colors, outlined panels, and motion. The implementation and TCoVP-specific presentation are independent.

## Files

- `index.html`, `style.css`, `app.js`: page, responsive styling, and interactions.
- `samples-data.json`: sample content and replay metadata.
- `results.js`, `results-data.json`: result views and manuscript tables.
- `assets/`: local fonts, PDF, video excerpts, and stills.

To review this design without changing the public homepage, keep it on its feature branch. Publishing or replacing the original page is a separate step.
