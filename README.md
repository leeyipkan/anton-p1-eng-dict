# Sunny Class — Primary 1 English Dictation

Revision material for Anton's Chapter 5 and Chapter 6 English dictation, built from the two
photographed dictation sheets (p.2 and p.3).

- **Chapter 5** — dictation on **Wednesday 11 November 2026**
- **Chapter 6** — dictation on **Wednesday 25 November 2026** (estimated: two weeks after Chapter 5)

Live site: **https://leeyipkan.github.io/anton-p1-eng-dict/**

## What is in it

**Three games**, all driven by the same eight words:

| Game | What happens |
|---|---|
| Listen &amp; write | A female English voice says the word or sentence; he types it; it marks itself. |
| Build it | The word is broken into letter tiles. Tap them in the right order. |
| Tap the word | Hear it, then pick it out of four. |

Each game scores out of 8, saves the best score, and throws confetti at the end.

**Word cards** — every word has a speaker button, the syllable split, a plain-English tip about the
tricky grapheme, and a box to type it in. "Hide the words" blanks them all so he cannot copy.

**A progress ring** — how many of the 16 words he has spelled correctly at least once, on the home
page and per chapter.

**A day-by-day plan** — four days for Chapter 5, twelve steps for Chapter 6, with tick boxes that
are remembered on the device.

**A printable paper pack** (`Anton_P1_Dictation_Prep_Pack.pdf`, 21 pages) — the same material on
paper: word lists with the tricky letters in orange, Look–Cover–Write–Check, a missing-letter sheet,
a "circle the right spelling" sheet, sentence copy pages, blank dictation paper, and a dictation
script with a marking sheet for the parent.

## The voice

The site picks a **female English voice** from whatever the browser offers — it scores the installed
voices by name and language, prefers `en-GB`, and keeps Google/neural voices ahead of the rest. On a
phone that usually lands on *Google UK English Female*, *Samantha*, *Karen* or *Moira*.

A picker on the Play screen lists the available English voices with a ♀ next to the female-sounding
ones, in case the automatic choice is wrong. The choice is saved.

Two details worth knowing:

- `"female"` contains `"male"` and `"woman"` contains `"man"`, so male names are matched against a
  name with those words blanked out. Without that, the female bonus cancels itself and the site picks
  a man.
- Speech must start from a tap. The first pointer press primes the engine, which is what makes it
  work on an iPhone.

## Marking

Spelling must be exact. A capital letter and an end mark are marks too, so an answer with the right
words but no full stop is marked with a warning rather than as wrong — that is the one thing a child
can fix by himself on the day.

## Testing

An end-to-end suite drives real Chrome over the DevTools protocol: 43 checks covering layout at three
widths, automated WCAG AA contrast for every text style, tap-target size, the female-voice choice
(with a stubbed speech engine), every word-card path, all three games run to a full score, wrong-answer
handling, the "Next" button staying hidden until an answer is checked, localStorage persistence, every
internal link, the print stylesheet and the PDF.

The harness lives in the project's `tools/` folder, one level above this published folder — it is not
deployed. From the project root:

```sh
python -m http.server 8901 --directory site     # then, in another shell:
node tools/e2e.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe"
node tools/e2e.mjs "<chrome>" "https://leeyipkan.github.io/anton-p1-eng-dict"   # against production
```

`tools/shots.mjs` and `tools/states.mjs` capture screenshots of each page and each in-play state.

Note: the suite disables the browser cache on purpose. Without that, a reused Chrome profile happily
serves the previous deploy's CSS and the run reports yesterday's result.

## Notes

- The plan dates assume a Wednesday dictation. If the school moves it, shift the days; the order of
  the steps matters more than the dates.
- Chapter 6's date is inferred from "two weeks later". It is not on the sheet.
- No build step: plain HTML, CSS and JavaScript. Scores and coins stay in `localStorage`.
