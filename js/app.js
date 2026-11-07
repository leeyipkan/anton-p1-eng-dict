/* Sunny Class — P1 English Dictation. Vanilla JS, no build step. */
(function () {
  "use strict";

  var DICT = window.DICT || {};
  var KEY = "sunny-dict-v1";

  /* ------------------------------------------------------------- store -- */

  function blank() { return { coins: 0, ticks: {}, best: {} }; }

  var Store = {
    read: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return blank();
        var parsed = JSON.parse(raw);
        return { coins: parsed.coins || 0, ticks: parsed.ticks || {}, best: parsed.best || {} };
      } catch (e) { return blank(); }
    },
    write: function (patch) {
      var next = Object.assign(this.read(), patch);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* private mode */ }
      paintCoins();
      return next;
    },
    addCoins: function (n) {
      var cur = this.read();
      return this.write({ coins: Math.max(0, cur.coins + n) });
    },
    toggleTick: function (key) {
      var cur = this.read();
      var ticks = Object.assign({}, cur.ticks);
      if (ticks[key]) { delete ticks[key]; } else { ticks[key] = 1; }
      return this.write({ ticks: ticks });
    }
  };

  function paintCoins() {
    var n = Store.read().coins;
    document.querySelectorAll("[data-coins]").forEach(function (el) {
      el.textContent = "🪙 " + n;
    });
  }

  /* ------------------------------------------------------------- speech -- */

  var keepAlive = 0;

  function isAppleTouch() {
    var ua = navigator.userAgent || "";
    var iPhone = /iPad|iPhone|iPod/.test(ua);
    var iPadDesk = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iPhone || iPadDesk;
  }

  function primeSpeech() {
    if (!window.speechSynthesis) return;
    if (navigator.audioSession) { try { navigator.audioSession.type = "playback"; } catch (e) {} }
    window.speechSynthesis.getVoices();
    window.speechSynthesis.resume();
    if (!keepAlive) {
      keepAlive = window.setInterval(function () {
        var s = window.speechSynthesis;
        if (s && s.speaking && s.paused) s.resume();
      }, 250);
    }
  }

  function englishVoice() {
    var voices = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      if (/^en-gb/i.test(voices[i].lang)) return voices[i];
    }
    for (var j = 0; j < voices.length; j++) {
      if (/^en/i.test(voices[j].lang)) return voices[j];
    }
    return null;
  }

  function speak(text, rate) {
    if (!window.speechSynthesis) return false;
    var line = String(text || "").trim();
    if (!line) return false;
    var synth = window.speechSynthesis;
    primeSpeech();
    var utter = new SpeechSynthesisUtterance(line);
    utter.lang = "en-GB";
    utter.rate = rate || 0.85;
    utter.volume = 1;
    var voice = englishVoice();
    if (voice) utter.voice = voice;

    function start() { synth.resume(); synth.speak(utter); }

    if (isAppleTouch()) {
      if (synth.speaking || synth.pending) {
        synth.cancel();
        window.setTimeout(start, 120);
      } else {
        start();
      }
      return true;
    }
    synth.cancel();
    start();
    return true;
  }

  /* ------------------------------------------------------------ helpers -- */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function partsHTML(parts) {
    return (parts || []).map(function (p) {
      return p[1] ? '<span class="tricky">' + esc(p[0]) + "</span>" : esc(p[0]);
    }).join("");
  }

  function norm(s) {
    return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function stripPunct(s) {
    return norm(s).replace(/[.,!?;:'"\-]/g, "").replace(/\s+/g, " ").trim();
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function daysUntil(iso) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var target = new Date(iso + "T00:00:00");
    return Math.round((target - now) / 86400000);
  }

  function countdownText(iso) {
    var d = daysUntil(iso);
    if (d === 0) return "today!";
    if (d === 1) return "tomorrow";
    if (d > 1) return d + " days to go";
    if (d === -1) return "yesterday";
    return "done";
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function onSpeak(root) {
    root.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-say]");
      if (!btn) return;
      ev.preventDefault();
      speak(btn.getAttribute("data-say"), parseFloat(btn.getAttribute("data-rate")) || 0.85);
    });
  }

  /* --------------------------------------------------------------- home -- */

  function paintCountdowns() {
    qsa("[data-countdown]").forEach(function (el) {
      var id = el.getAttribute("data-countdown");
      if (DICT[id]) el.textContent = countdownText(DICT[id].date);
    });
  }

  function renderHome() {
    var today = todayISO();
    var jobs = [];

    ["ch5", "ch6"].forEach(function (id) {
      var ch = DICT[id];
      ch.plan.forEach(function (row) {
        if (row.date === today) jobs.push({ ch: ch, row: row });
      });
    });

    var box = qs("[data-today]");
    if (!box) return;

    if (jobs.length) {
      box.innerHTML = jobs.map(function (job) {
        return (
          '<div class="date-card' + (job.row.final ? "" : " now") + '">' +
          '<p class="tag">TODAY · ' + esc(job.ch.label.toUpperCase()) + "</p>" +
          '<p class="when">' + esc(job.row.when) + "</p>" +
          '<p class="sub">' + esc(job.row.what) + "</p>" +
          '<div class="btn-row" style="margin-top:12px">' +
          '<a class="btn btn-primary" href="' + rel(job.ch.id) + '/">Open the words</a>' +
          '<a class="btn btn-ghost" href="practice/?ch=' + job.ch.id + '">Practice test</a>' +
          "</div></div>"
        );
      }).join("");
    } else {
      var next = null;
      ["ch5", "ch6"].forEach(function (id) {
        DICT[id].plan.forEach(function (row) {
          if (row.date >= today && (!next || row.date < next.row.date)) next = { ch: DICT[id], row: row };
        });
      });
      box.innerHTML = next
        ? '<div class="date-card"><p class="tag">NOTHING TODAY</p>' +
          '<p class="when">Next: ' + esc(next.row.when) + "</p>" +
          '<p class="sub">' + esc(next.row.what) + "</p></div>"
        : '<div class="date-card"><p class="tag">ALL DONE</p>' +
          '<p class="when">Both dictations are behind him.</p>' +
          '<p class="sub">Keep the words warm with a five-minute practice test now and then.</p></div>';
    }
  }

  function rel(id) {
    var onChapter = document.body.getAttribute("data-page") === "chapter";
    return onChapter ? "../" + id + "/" : id + "/";
  }

  /* ------------------------------------------------------------ chapter -- */

  function renderChapter() {
    var id = document.body.getAttribute("data-ch");
    var ch = DICT[id];
    if (!ch) return;

    var grid = qs("[data-words]");
    if (grid) {
      grid.innerHTML = ch.words.map(function (w) {
        return (
          '<article class="word-card" data-plain="' + esc(w.plain) + '">' +
          '<div class="word-head">' +
          '<span class="word-num">' + w.n + "</span>" +
          '<button class="speak" data-say="' + esc(w.plain) + '" aria-label="Say ' + esc(w.plain) + '">🔊</button>' +
          "</div>" +
          '<p class="word-text">' + partsHTML(w.parts) + "</p>" +
          '<p class="word-syll">' + esc(w.syll) + "</p>" +
          '<p class="word-tip">' + esc(w.tip) + "</p>" +
          '<div class="word-practice">' +
          '<input class="write-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Write it" aria-label="Write ' + esc(w.plain) + '">' +
          '<button class="check-btn">Check</button>' +
          "</div>" +
          '<p class="feedback" aria-live="polite"></p>' +
          "</article>"
        );
      }).join("");
    }

    var list = qs("[data-sentences]");
    if (list) {
      list.innerHTML = ch.sentences.map(function (s) {
        return (
          '<li class="sent-item">' +
          '<span class="num">' + s.n + "</span>" +
          '<span class="sent-text">' + partsHTML(s.parts) + "</span>" +
          '<button class="speak" data-say="' + esc(s.plain) + '" data-rate="0.8" aria-label="Say sentence ' + s.n + '">🔊</button>' +
          "</li>"
        );
      }).join("");
    }

    if (grid) {
      grid.addEventListener("click", function (ev) {
        var card = ev.target.closest(".word-card");
        if (!card) return;
        if (!ev.target.classList.contains("check-btn")) return;
        var input = qs(".write-input", card);
        var fb = qs(".feedback", card);
        var plain = card.getAttribute("data-plain");
        var given = input.value;

        if (!norm(given)) {
          fb.className = "feedback warn";
          fb.textContent = "Write it first, then check.";
          input.focus();
          return;
        }
        if (norm(given) === norm(plain)) {
          fb.className = "feedback ok";
          fb.textContent = "✓ Yes! " + plain;
          card.classList.add("correct");
          input.disabled = true;
          ev.target.disabled = true;
          Store.addCoins(2);
          speak(plain);
        } else {
          fb.className = "feedback no";
          fb.textContent = "✗ Have another look — check the orange letters.";
          card.classList.remove("correct");
          input.select();
        }
      });

      grid.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        var card = ev.target.closest(".word-card");
        if (!card) return;
        ev.preventDefault();
        qs(".check-btn", card).click();
      });
    }

    var coverBtn = qs("[data-cover]");
    if (coverBtn && grid) {
      coverBtn.addEventListener("click", function () {
        var on = grid.classList.toggle("covered");
        coverBtn.textContent = on ? "👀 Show the words" : "🙈 Hide the words";
        coverBtn.setAttribute("aria-pressed", on ? "true" : "false");
        if (!on) speak("Look at the word. Cover it. Write it. Check it.");
      });
    }

    qsa("[data-ch-link]").forEach(function (a) {
      a.setAttribute("aria-current", a.getAttribute("data-ch-link") === id ? "page" : "false");
    });
  }

  /* ----------------------------------------------------------- practice -- */

  var quiz = {
    chapter: "ch5",
    part: "words",
    items: [],
    idx: 0,
    score: 0,
    notes: [],
    stage: "setup"
  };

  function practiceRoot() { return qs("[data-practice]"); }

  function renderSetup() {
    var root = practiceRoot();
    if (!root) return;
    var ch = DICT[quiz.chapter];
    var best = Store.read().best[quiz.chapter + "-" + quiz.part];

    root.innerHTML =
      '<div class="practice-stage">' +
      '<p class="kicker">Practice test</p>' +
      '<h1>Listen and write</h1>' +
      '<p class="lede" style="margin-bottom:14px">' +
      (quiz.part === "words" ? "Eight words. It says one, he writes it, it marks itself." : "Eight sentences. Same idea, but a whole line to write.") +
      "</p>" +

      '<p class="hint" style="margin-top:8px">Which chapter?</p>' +
      '<div class="chip-row">' +
      '<button class="chip" data-set-ch="ch5" aria-pressed="' + (quiz.chapter === "ch5") + '">Chapter 5</button>' +
      '<button class="chip" data-set-ch="ch6" aria-pressed="' + (quiz.chapter === "ch6") + '">Chapter 6</button>' +
      "</div>" +

      '<p class="hint" style="margin-top:14px">Words or sentences?</p>' +
      '<div class="chip-row">' +
      '<button class="chip" data-set-part="words" aria-pressed="' + (quiz.part === "words") + '">Words</button>' +
      '<button class="chip" data-set-part="sentences" aria-pressed="' + (quiz.part === "sentences") + '">Sentences</button>' +
      "</div>" +

      (best ? '<p class="hint" style="margin-top:16px">Best so far: ' + best + " / 8</p>" : "") +
      '<p class="hint" style="margin-top:4px">' + esc(ch.dateLabel) + "</p>" +

      '<div class="btn-row" style="justify-content:center;margin-top:18px">' +
      '<button class="btn btn-primary btn-lg" data-start>▶ Start</button>' +
      '<button class="btn btn-ghost" data-say="Listen carefully, then write the word.">🔊 Check the sound</button>' +
      "</div>" +
      "</div>";

    root.addEventListener("click", function (ev) {
      var chBtn = ev.target.closest("[data-set-ch]");
      if (chBtn) { quiz.chapter = chBtn.getAttribute("data-set-ch"); renderSetup(); return; }
      var partBtn = ev.target.closest("[data-set-part]");
      if (partBtn) { quiz.part = partBtn.getAttribute("data-set-part"); renderSetup(); return; }
      if (ev.target.closest("[data-start]")) startQuiz();
    });
  }

  function currentItems() {
    var ch = DICT[quiz.chapter];
    var source = quiz.part === "words" ? ch.words : ch.sentences;
    return shuffle(source);
  }

  function startQuiz() {
    quiz.items = currentItems();
    quiz.idx = 0;
    quiz.score = 0;
    quiz.notes = [];
    quiz.stage = "run";
    renderQuestion();
  }

  function itemNumber() { return quiz.idx + 1; }

  function renderQuestion() {
    var root = practiceRoot();
    var item = quiz.items[quiz.idx];
    if (!root || !item) return finishQuiz();

    var total = quiz.items.length;
    var pct = Math.round((quiz.idx / total) * 100);

    root.innerHTML =
      '<div class="practice-stage">' +
      '<span class="progress-pill">' + itemNumber() + " of " + total + " · " + esc(DICT[quiz.chapter].label) + "</span>" +
      '<div style="height:6px;background:#f2e3c9;border-radius:999px;overflow:hidden;margin-bottom:20px">' +
      '<div style="height:100%;width:' + pct + '%;background:#f59e0b"></div></div>' +

      '<button class="btn btn-primary btn-lg" data-say="' + esc(item.plain) + '" data-rate="' +
      (quiz.part === "words" ? "0.8" : "0.82") + '" data-repeat>' +
      "🔊 Say it again</button>" +

      '<input class="big-input" data-answer type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' +
      (quiz.part === "words" ? "type the word" : "type the sentence") + '" aria-label="Your answer">' +

      '<p class="feedback" data-fb aria-live="polite" style="min-height:26px"></p>' +
      '<p class="answer-reveal" data-reveal></p>' +

      '<div class="btn-row" style="justify-content:center;margin-top:10px">' +
      '<button class="btn btn-primary" data-check>Check</button>' +
      '<button class="btn btn-ghost" data-next hidden>Next →</button>' +
      "</div>" +
      "</div>";

    var input = qs("[data-answer]", root);
    input.focus();
    speak(item.plain, quiz.part === "words" ? 0.8 : 0.82);

    input.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      var next = qs("[data-next]", root);
      if (next && !next.hidden) { next.click(); } else { qs("[data-check]", root).click(); }
    });

    qs("[data-check]", root).addEventListener("click", function () {
      checkAnswer(root, item);
    });
    qs("[data-next]", root).addEventListener("click", function () {
      quiz.idx += 1;
      if (quiz.idx >= quiz.items.length) finishQuiz();
      else renderQuestion();
    });
  }

  function checkAnswer(root, item) {
    var input = qs("[data-answer]", root);
    var fb = qs("[data-fb]", root);
    var reveal = qs("[data-reveal]", root);
    var given = input.value;

    if (!norm(given)) {
      fb.className = "feedback warn";
      fb.textContent = "Write something first — a guess is fine.";
      input.focus();
      return;
    }

    var exact = norm(given) === norm(item.plain);
    var closeEnough = !exact && stripPunct(given) === stripPunct(item.plain);

    if (exact) {
      fb.className = "feedback ok";
      fb.textContent = "✓ Correct!";
      quiz.score += 1;
      Store.addCoins(2);
    } else if (closeEnough) {
      fb.className = "feedback warn";
      fb.textContent = "✓ Right words — but check the capital letters and the full stop.";
      quiz.score += 1;
      Store.addCoins(1);
    } else {
      fb.className = "feedback no";
      fb.textContent = "✗ Not quite.";
    }

    reveal.innerHTML = exact ? "" : "Answer: <strong>" + esc(item.plain) + "</strong>";
    if (!exact) speak(item.plain, 0.75);

    input.disabled = true;
    qs("[data-check]", root).disabled = true;
    var next = qs("[data-next]", root);
    next.hidden = false;
    next.textContent = quiz.idx + 1 >= quiz.items.length ? "See the score →" : "Next →";
    next.focus();
  }

  function finishQuiz() {
    var root = practiceRoot();
    var total = quiz.items.length || 8;
    var score = quiz.score;
    var key = quiz.chapter + "-" + quiz.part;
    var store = Store.read();
    var prevBest = store.best[key] || 0;

    if (score > prevBest) {
      var best = Object.assign({}, store.best);
      best[key] = score;
      Store.write({ best: best });
    }
    Store.addCoins(score);

    var stars = score >= total ? "⭐⭐⭐" : score >= total - 2 ? "⭐⭐" : score >= total / 2 ? "⭐" : "";
    var line = score >= total
      ? "Perfect. That is dictation-ready."
      : score >= total - 2
        ? "Strong. Fix the two or three misses and he is there."
        : score >= total / 2
          ? "Halfway. Go back to the word cards for the misses."
          : "Early days. Read the words out loud together first, then try again.";

    root.innerHTML =
      '<div class="practice-stage">' +
      '<p class="kicker">Result</p>' +
      '<p class="score-big">' + score + " / " + total + "</p>" +
      '<p class="stars">' + stars + "</p>" +
      '<p class="lede">' + line + "</p>" +
      (prevBest ? '<p class="hint" style="margin-top:8px">Previous best: ' + prevBest + " / " + total + "</p>" : "") +
      '<div class="btn-row" style="justify-content:center;margin-top:20px">' +
      '<button class="btn btn-primary" data-again>Try again</button>' +
      '<button class="btn btn-ghost" data-home>Back to the words</button>' +
      "</div></div>";

    qs("[data-home]", root).addEventListener("click", function () {
      window.location.href = "../" + quiz.chapter + "/";
    });
    qs("[data-again]", root).addEventListener("click", function () {
      quiz.stage = "setup";
      renderSetup();
    });
    speak(score >= total - 2 ? "Well done, Anton!" : "Good try. Let us look at the tricky ones.", 0.9);
  }

  function renderPractice() {
    var params = new URLSearchParams(window.location.search);
    var ch = params.get("ch");
    var part = params.get("part");
    if (ch && DICT[ch]) quiz.chapter = ch;
    if (part === "sentences" || part === "words") quiz.part = part;
    renderSetup();
  }

  /* --------------------------------------------------------------- plan -- */

  function renderPlan() {
    var today = todayISO();
    ["ch5", "ch6"].forEach(function (id) {
      var body = qs('[data-plan="' + id + '"]');
      if (!body) return;
      var ch = DICT[id];
      var ticks = Store.read().ticks;
      body.innerHTML = ch.plan.map(function (row) {
        var key = id + ":" + row.date;
        var done = !!ticks[key];
        return (
          '<tr class="' + (row.date === today ? "today" : "") + '">' +
          "<td>" + (row.final ? "★" : "") + "</td>" +
          '<td class="when">' + esc(row.when) + "</td>" +
          "<td>" + esc(row.what) + "</td>" +
          '<td><button class="tick' + (done ? " on" : "") + '" data-tick="' + key + '" aria-label="Mark done" aria-pressed="' + done + '">' + (done ? "✓" : "") + "</button></td>" +
          "</tr>"
        );
      }).join("");
    });
  }

  function wireTicks() {
    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-tick]");
      if (!btn) return;
      var res = Store.toggleTick(btn.getAttribute("data-tick"));
      var on = !!res.ticks[btn.getAttribute("data-tick")];
      btn.classList.toggle("on", on);
      btn.textContent = on ? "✓" : "";
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  /* --------------------------------------------------------------- boot -- */

  function boot() {
    paintCoins();
    paintCountdowns();
    onSpeak(document);
    wireTicks();

    window.addEventListener("pointerdown", primeSpeech, { once: true });

    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHome();
    if (page === "chapter") renderChapter();
    if (page === "practice") renderPractice();
    if (page === "plan") renderPlan();

    qsa("[data-print]").forEach(function (btn) {
      btn.addEventListener("click", function () { window.print(); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
