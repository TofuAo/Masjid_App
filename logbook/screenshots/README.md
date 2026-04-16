# Screenshots for logbook

Screenshots are embedded in the Word logbooks when you run:

```bash
node scripts/generate-logbook-week-word.js
```

Each screenshot can include a **caption** explaining what it shows. Captions are inserted directly below the image in the report.

---

## 1. Where to put screenshots

- **By week and day:** `logbook/screenshots/week{N}/day{M}.png` (or `.jpg`)
  - `N` = week number (1–24), `M` = day index in that week (1–5)
- **Flat naming:** `logbook/screenshots/week{N}_day{M}.png` (or `.jpg`)

Examples: `week8/day1.png`, `week4_day3.jpg`

---

## 2. Captions (what the screenshot shows)

Use **one** of these:

**A) In LOG_BOOK.md** (per day):

```markdown
### Day 3 - Friday, October 10, 2025
**Date:** October 10, 2025

**Tasks Completed:**
- ...

**Screenshot caption:** Login page showing IC and password fields.
```

**B) Caption file next to the image:**

- `logbook/screenshots/week{N}/day{M}_caption.txt`, or  
- `logbook/screenshots/week{N}_day{M}_caption.txt`

Put one short line (up to 200 characters) describing what the screenshot shows. This is used when no **Screenshot caption** is set in LOG_BOOK.md.

---

## 3. Automatic capture (optional)

The script **automatically identifies the most relevant UI section** from each day’s report content in LOG_BOOK.md, then captures only that section (with optional selector) and embeds it in the correct place with a caption.

1. Install Playwright:
   ```bash
   npm install --save-dev playwright
   npx playwright install chromium
   ```

2. Start your app (e.g. `npm run dev`).

3. **Auto-detect (default):**  
   Edit `logbook/screenshots/capture-config.json` and use **topicMappings**: each entry has `keywords` (matched against the day’s “Tasks Completed” text), `path`, `selector` (to focus on relevant UI only), and `caption`. The script parses LOG_BOOK.md, matches each day’s topic to the first matching mapping, and captures that route/selector.

4. Run:
   ```bash
   npm run capture:logbook:screenshots
   ```
   or
   ```bash
   node scripts/capture-logbook-screenshots.js
   ```

5. **If context cannot be determined:**  
   For any day where no topicMapping matches, the script prints something like:
   ```text
   Context could not be determined for the following days. Please add a mapping ...
     Week 8 Day 2: "implemented api endpoints..."
   ```
   Add a new entry to **topicMappings** (with the right keywords, path, selector, caption) or add an explicit entry to **captures** for that week/day, then run again.

6. Screenshots are saved to `week{N}/day{M}.png` and captions to `week{N}_day{M}_caption.txt`. They are embedded in the correct place when you run:
   ```bash
   npm run generate:logbook:word
   ```

**Explicit captures:** You can still use the **captures** array in `capture-config.json` for specific week/day/path/selector/caption. Those are used in addition to (or instead of, if you disable auto-detect) the topic-based captures.

---

## 4. Manual screenshots

- Capture only the **relevant area** (crop to the section that matches the report).
- Save as PNG or JPG to `week{N}/day{M}.png` (or `week{N}_day{M}.png`).
- Add a caption in LOG_BOOK.md (**Screenshot caption:**) or in a `*_caption.txt` file as above.

---

## 5. Code screenshots (optional)

If you use **Code Screenshot Suggestions** in the logbook and have **catage** installed, the script can generate syntax-highlighted code images. If a pre-placed image exists for that week/day, it is used instead. A default caption is used unless you set **Screenshot caption** or a caption file.
