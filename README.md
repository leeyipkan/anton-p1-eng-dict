# Sunny Class — Primary 1 English Dictation

Revision material for Anton's Chapter 5 and Chapter 6 English dictation, built from the two
photographed dictation sheets (p.2 and p.3).

- **Chapter 5** — dictation on **Wednesday 11 November 2026**
- **Chapter 6** — dictation on **Wednesday 25 November 2026** (estimated: two weeks after Chapter 5)

## What is in it

**A printable paper pack** (`Anton_P1_Dictation_Prep_Pack.pdf`, 21 pages) — a four-day plan for
Chapter 5 and a twelve-step plan for Chapter 6, word lists with the tricky grapheme in orange,
Look–Cover–Write–Check, a missing-letter sheet, a "circle the right spelling" sheet, sentence copy
pages, blank dictation paper, and a dictation script with a marking sheet for the parent.

**This site** — the same words and sentences with sound. Each word card says the word, takes a typed
answer and marks it. The practice test reads an item, the child types it, and the page marks itself.
Scores and coin totals stay in the browser on that device; nothing is sent to a server.

## The content

| Chapter 5 | |
|---|---|
| Words | an ear, thin, a leg, tall, an arm, a mouth, a foot, shoulders |
| Sentences | Pat is looking for her cat. / Can you help me? / Who is that? / He has short hair and big eyes. / He is very fat. / He is a naughty boy. / He does not have a small nose. / You are a good boy! |

| Chapter 6 | |
|---|---|
| Words | dirty, smelly, brown, cute, a poster, perfect, sad, a duck |
| Sentences | They are watching TV. / I like that horse. / It has long legs. / It is a farm animal. / Can I have a pig, please? / They go to a pet shop. / They have long tails. / I like this rabbit. |

## Marking

Spelling must be exact. A capital letter and an end mark are marks too, so an answer with the right
words but no full stop is marked with a warning rather than as wrong — that is the one thing a child
can fix by himself on the day.

## Notes

- Sound needs one tap before it will play; browsers block audio that starts on its own. The page
  primes the voice on the first pointer press, which is what makes it work on an iPhone.
- The plan dates assume a Wednesday dictation. If the school moves it, shift the days; the order of
  the steps matters more than the dates.
- Chapter 6's date is inferred from "two weeks later". It is not on the sheet.

## Run it locally

```sh
python -m http.server 8901 --directory site
```

Then open <http://127.0.0.1:8901/>. There is no build step — plain HTML, CSS and JavaScript.
