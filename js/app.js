/* Sunny Class — P1 English Dictation.
   Vanilla JS, no build step. Three games, one voice, no data leaves the device. */
(function () {
  "use strict";

  var DICT = window.DICT || {};
  var KEY = "sunny-dict-v2";

  /* ----------------------------------------------------------------- store */

  function blank() {
    return { coins: 0, ticks: {}, best: {}, mastered: {}, voiceURI: "" };
  }

  var Store = {
    read: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return blank();
        var p = JSON.parse(raw);
        return {
          coins: p.coins || 0,
          ticks: p.ticks || {},
          best: p.best || {},
          mastered: p.mastered || {},
          voiceURI: p.voiceURI || ""
        };
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
    markMastered: function (ch, n) {
      var cur = this.read();
      var m = Object.assign({}, cur.mastered);
      m[ch + ":" + n] = 1;
      return this.write({ mastered: m });
    },
    masteredCount: function (ch) {
      var m = this.read().mastered;
      var total = 0;
      Object.keys(m).forEach(function (k) { if (k.indexOf(ch + ":") === 0) total++; });
      return total;
    },
    toggleTick: function (key) {
      var cur = this.read();
      var ticks = Object.assign({}, cur.ticks);
      if (ticks[key]) delete ticks[key]; else ticks[key] = 1;
      return this.write({ ticks: ticks });
    }
  };

  function paintCoins() {
    var n = Store.read().coins;
    document.querySelectorAll("[data-coins]").forEach(function (el) {
      if (el.textContent.replace(/\D/g, "") === String(n)) return;
      el.textContent = "🪙 " + n;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      setTimeout(function () { el.classList.remove("bump"); }, 260);
    });
  }

  /* ---------------------------------------------------------------- speech */

  var keepAlive = 0;
  var currentButton = null;

  /* Names that real speech engines ship as female English voices. */
  var FEMALE_HINTS = [
    "female", "woman", "samantha", "karen", "moira", "tessa", "victoria", "fiona",
    "serena", "allison", "ava", "susan", "zira", "hazel", "libby", "sonia",
    "joanna", "amy", "emma", "olivia", "aria", "jenny", "michelle", "kate",
    "stephanie", "salli", "nicole", "nicky", "martha", "veena", "catherine",
    "ellie", "molly", "nora", "lucy", "maisie", "abbi", "bella", "nova"
  ];

  /* Careful: "female" contains "male" and "woman" contains "man", so male names are
     matched against a name with those words blanked out, and "man" is not a hint at all
     (it is inside "Samantha"). */
  var MALE_HINTS = [
    "male", "daniel", "alex", "fred", "david", "mark", "george", "james",
    "ryan", "guy", "tom", "aaron", "arthur", "oliver", "thomas", "liam",
    "brian", "christopher", "eric", "jacob", "matthew", "rishi", "gordon",
    "diego", "jorge", "luca"
  ];

  function maleSearchName(name) {
    return name.replace(/female/g, "x").replace(/woman/g, "x");
  }

  function nameLooksFemale(v) {
    var n = (v.name || "").toLowerCase();
    var isFemale = FEMALE_HINTS.some(function (h) { return n.indexOf(h) >= 0; });
    var maleName = maleSearchName(n);
    var isMale = MALE_HINTS.some(function (h) { return maleName.indexOf(h) >= 0; });
    return isFemale && !isMale;
  }

  function isAppleTouch() {
    var ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
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

  function englishVoices() {
    if (!window.speechSynthesis) return [];
    return (window.speechSynthesis.getVoices() || []).filter(function (v) {
      return /^en/i.test(v.lang || "");
    });
  }

  function scoreFemale(v) {
    var name = (v.name || "").toLowerCase();
    var maleName = maleSearchName(name);
    var s = 0;
    FEMALE_HINTS.forEach(function (h) { if (name.indexOf(h) >= 0) s += 100; });
    MALE_HINTS.forEach(function (h) { if (maleName.indexOf(h) >= 0) s -= 180; });
    if (/^en-gb/i.test(v.lang)) s += 60;
    else if (/^en-(au|nz|ie|za)/i.test(v.lang)) s += 45;
    else if (/^en-us/i.test(v.lang)) s += 30;
    else s += 8;
    if (/google|natural|neural|premium|enhanced|siri/i.test(v.name || "")) s += 30;
    if (v.localService === false) s += 8;
    return s;
  }

  function bestFemaleVoice() {
    var list = englishVoices();
    if (!list.length) return null;
    var stored = Store.read().voiceURI;
    if (stored) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].voiceURI === stored) return list[i];
      }
    }
    var ranked = list
      .map(function (v) { return { v: v, s: scoreFemale(v) }; })
      .sort(function (a, b) { return b.s - a.s; });
    /* Only accept something that actually scored as female; otherwise still take the best. */
    return ranked[0] ? ranked[0].v : null;
  }

  function speak(text, rate, btn) {
    var line = String(text || "").trim();
    if (!line) return false;
    /* Never let a quirky or hostile speech engine break the page: a game that
       cannot talk is still a game, but a game that throws is a blank screen. */
    try {
      if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return false;
      var synth = window.speechSynthesis;
      primeSpeech();

      var utter = new window.SpeechSynthesisUtterance(line);
      utter.lang = "en-GB";
      utter.rate = rate || 0.85;
      utter.pitch = 1.06;
      utter.volume = 1;
      var voice = bestFemaleVoice();
      if (voice) {
        try {
          utter.voice = voice;
          utter.lang = voice.lang || "en-GB";
        } catch (e) { /* some engines reject unfamiliar voice objects */ }
      }

      if (currentButton) currentButton.classList.remove("speaking");
      if (btn) { btn.classList.add("speaking"); currentButton = btn; }

      function done() {
        if (btn) {
          btn.classList.remove("speaking");
          if (currentButton === btn) currentButton = null;
        }
      }
      utter.onend = done;
      utter.onerror = done;

      function start() {
        try { synth.resume(); synth.speak(utter); } catch (e) { done(); }
      }

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
    } catch (e) {
      return false;
    }
  }

  /* --------------------------------------------------------------- confetti */

  var confetti = (function () {
    var canvas, ctx, parts = [], raf = 0, dpr = 1;

    function ensure() {
      if (canvas) return;
      canvas = document.createElement("canvas");
      canvas.id = "confetti";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
      resize();
      window.addEventListener("resize", resize);
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    var COLORS = ["#f59e0b", "#ea580c", "#dc2626", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#fbbf24"];

    function shoot(x, y, count) {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      ensure();
      var n = count || 34;
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        var sp = 3 + Math.random() * 7;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 4,
          size: 4 + Math.random() * 6,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4,
          life: 1
        });
      }
      if (!raf) tick();
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 0.26;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.008;
        if (p.life <= 0 || p.y > window.innerHeight + 40) { parts.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.66);
        ctx.restore();
      }
      if (!parts.length) { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    }

    function from(el, count) {
      if (el && el.getBoundingClientRect) {
        var r = el.getBoundingClientRect();
        shoot(r.left + r.width / 2, r.top + r.height / 2, count);
      } else {
        shoot(window.innerWidth / 2, window.innerHeight * 0.4, count);
      }
    }

    return { from: from, shoot: shoot };
  })();

  /* --------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function partsHTML(parts) {
    return (parts || []).map(function (p) {
      return p[1] ? '<span class="tricky">' + esc(p[0]) + "</span>" : esc(p[0]);
    }).join("");
  }

  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function stripPunct(s) {
    return norm(s).replace(/[.,!?;:'"\-]/g, "").replace(/\s+/g, " ").trim();
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function daysUntil(iso) {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((new Date(iso + "T00:00:00") - now) / 86400000);
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

  function splitArticle(plain) {
    if (/^an /i.test(plain)) return { article: "an", rest: plain.slice(3) };
    if (/^a /i.test(plain)) return { article: "a", rest: plain.slice(2) };
    return { article: "", rest: plain };
  }

  function isChapterPage() { return document.body.getAttribute("data-page") === "chapter"; }

  function rel(id) { return isChapterPage() ? "../" + id + "/" : id + "/"; }

  function onSpeak(root) {
    root.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-say]");
      if (!btn) return;
      ev.preventDefault();
      speak(btn.getAttribute("data-say"), parseFloat(btn.getAttribute("data-rate")) || 0.85, btn);
    });
  }

  /* ------------------------------------------------------------ ring paint */

  function paintRing(host, pct, label, sub) {
    if (!host) return;
    var r = 40;
    var c = 2 * Math.PI * r;
    var off = c * (1 - Math.max(0, Math.min(1, pct)));
    host.innerHTML =
      '<div class="ring-wrap">' +
      '<svg class="ring" viewBox="0 0 100 100" role="img" aria-label="' + esc(label) + '">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#ea580c"/>' +
      "</linearGradient></defs>" +
      '<circle class="track" cx="50" cy="50" r="' + r + '"/>' +
      '<circle class="value" cx="50" cy="50" r="' + r + '" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '"/>' +
      "</svg>" +
      "<div><p class='ring-label'>" + esc(label) + "</p><p class='ring-sub'>" + esc(sub) + "</p></div>" +
      "</div>";

    var circle = qs(".value", host);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { circle.setAttribute("stroke-dashoffset", off.toFixed(1)); });
    });
  }

  /* ------------------------------------------------------------------ home */

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
      DICT[id].plan.forEach(function (row) {
        if (row.date === today) jobs.push({ ch: DICT[id], row: row });
      });
    });

    var box = qs("[data-today]");
    if (box) {
      if (jobs.length) {
        box.innerHTML = jobs.map(function (job) {
          return (
            '<div class="date-card' + (job.row.final ? "" : " now") + '">' +
            '<p class="tag">TODAY · ' + esc(job.ch.label.toUpperCase()) + "</p>" +
            '<p class="when">' + esc(job.row.when) + "</p>" +
            '<p class="sub">' + esc(job.row.what) + "</p>" +
            '<div class="btn-row" style="margin-top:13px">' +
            '<a class="btn btn-primary" href="' + rel(job.ch.id) + '/">Open the words</a>' +
            '<a class="btn btn-ghost" href="play/?ch=' + job.ch.id + '">Play</a>' +
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
          ? '<div class="date-card"><p class="tag">NOTHING TODAY</p><p class="when">Next: ' +
            esc(next.row.when) + '</p><p class="sub">' + esc(next.row.what) + "</p></div>"
          : '<div class="date-card"><p class="tag">ALL DONE</p><p class="when">Both dictations are behind him.</p>' +
            '<p class="sub">Keep the words warm with a five-minute game now and then.</p></div>';
      }
    }

    var done = Store.masteredCount("ch5") + Store.masteredCount("ch6");
    paintRing(qs("[data-ring]"), done / 16,
      done + " of 16 words",
      done === 0 ? "Tap a word card to begin"
        : done === 16 ? "Every word has been spelled right"
        : "Words he has spelled correctly at least once");
  }

  /* --------------------------------------------------------------- chapter */

  function renderChapter() {
    var id = document.body.getAttribute("data-ch");
    var ch = DICT[id];
    if (!ch) return;

    var grid = qs("[data-words]");
    if (grid) {
      grid.innerHTML = ch.words.map(function (w) {
        return (
          '<article class="word-card" data-plain="' + esc(w.plain) + '" data-n="' + w.n + '">' +
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
        if (!card || !ev.target.classList.contains("check-btn")) return;
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
          Store.markMastered(id, card.getAttribute("data-n"));
          confetti.from(card, 26);
          speak(plain, 0.85, qs(".speak", card));
          paintChapterRing();
        } else {
          fb.className = "feedback no";
          fb.textContent = "✗ Have another look — check the orange letters.";
          card.classList.remove("correct");
          card.classList.add("shake");
          setTimeout(function () { card.classList.remove("shake"); }, 420);
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
        if (!on) speak("Look at the word. Cover it. Write it. Check it.", 0.9, coverBtn);
      });
    }

    paintChapterRing();
  }

  function paintChapterRing() {
    var host = qs("[data-ring]");
    if (!host) return;
    var id = document.body.getAttribute("data-ch");
    var n = Store.masteredCount(id);
    paintRing(host, n / 8, n + " of 8 words",
      n === 8 ? "Chapter done — go and get it" : "Spelled right at least once");
  }

  /* ------------------------------------------------------------------ play */

  var play = {
    chapter: "ch5",
    mode: "type",     /* type | build | tap */
    part: "words",    /* words | sentences (type only) */
    items: [],
    idx: 0,
    score: 0,
    answers: []
  };

  function bestKey() {
    return play.chapter + "-" + play.mode + (play.mode === "type" ? "-" + play.part : "");
  }

  function playRoot() { return qs("[data-play]"); }

  function renderPlaySetup() {
    var root = playRoot();
    if (!root) return;
    var best = Store.read().best[bestKey()];

    root.innerHTML =
      '<div class="practice-stage">' +
      '<p class="kicker">Play</p>' +
      "<h1>Pick a game</h1>" +
      '<p class="lede">Same eight words, three ways to practise them.</p>' +

      '<div class="mode-grid">' +
      '<button class="mode-card" data-set-mode="type" aria-pressed="' + (play.mode === "type") + '">' +
      '<span class="emoji">🎧</span><strong>Listen &amp; write</strong>' +
      "<small>It says it, he types it, it marks itself.</small></button>" +
      '<button class="mode-card" data-set-mode="build" aria-pressed="' + (play.mode === "build") + '">' +
      '<span class="emoji">🧩</span><strong>Build it</strong>' +
      "<small>Tap the letters in the right order.</small></button>" +
      '<button class="mode-card" data-set-mode="tap" aria-pressed="' + (play.mode === "tap") + '">' +
      '<span class="emoji">👆</span><strong>Tap the word</strong>' +
      "<small>Hear it, then find it among four.</small></button>" +
      "</div>" +

      '<p class="hint" style="margin-top:18px">Chapter</p>' +
      '<div class="chip-row">' +
      '<button class="chip" data-set-ch="ch5" aria-pressed="' + (play.chapter === "ch5") + '">Chapter 5</button>' +
      '<button class="chip" data-set-ch="ch6" aria-pressed="' + (play.chapter === "ch6") + '">Chapter 6</button>' +
      "</div>" +

      (play.mode === "type"
        ? '<p class="hint" style="margin-top:14px">Words or sentences</p><div class="chip-row">' +
          '<button class="chip" data-set-part="words" aria-pressed="' + (play.part === "words") + '">Words</button>' +
          '<button class="chip" data-set-part="sentences" aria-pressed="' + (play.part === "sentences") + '">Sentences</button>' +
          "</div>"
        : "") +

      (best ? '<p class="hint" style="margin-top:16px">Best here: ' + best + " / 8</p>" : "") +
      '<p class="hint">' + esc(DICT[play.chapter].dateLabel) + "</p>" +

      '<div class="btn-row" style="justify-content:center;margin-top:20px">' +
      '<button class="btn btn-primary btn-lg" data-start>▶ Start</button>' +
      '<button class="btn btn-ghost" data-say="Listen carefully, then answer.">🔊 Test the sound</button>' +
      "</div>" +
      '<div class="voice-row" data-voice-picker></div>' +
      "</div>";

    paintVoicePicker(qs("[data-voice-picker]", root));
  }

  function startPlay() {
    var ch = DICT[play.chapter];
    if (play.mode === "tap") {
      play.items = shuffle(ch.words);
    } else if (play.mode === "build") {
      play.items = shuffle(ch.words);
    } else {
      play.items = shuffle(play.part === "sentences" ? ch.sentences : ch.words);
    }
    play.idx = 0;
    play.score = 0;
    play.answers = [];
    renderItem();
  }

  function total() { return play.items.length || 8; }

  function progressBar() {
    var pct = Math.round((play.idx / total()) * 100);
    return '<div class="bar"><i style="width:' + pct + '%"></i></div>';
  }

  function renderItem() {
    var root = playRoot();
    var item = play.items[play.idx];
    if (!root || !item) return finish();
    if (play.mode === "build") return renderBuild(root, item);
    if (play.mode === "tap") return renderTap(root, item);
    return renderType(root, item);
  }

  function stageHead(mode) {
    return (
      '<span class="progress-pill">' + (play.idx + 1) + " of " + total() +
      " · " + esc(DICT[play.chapter].label) + "</span>" + progressBar() +
      '<button class="btn btn-primary btn-lg" data-say="' + esc(play.items[play.idx].plain) +
      '" data-rate="0.8" data-repeat>🔊 Say it again</button>'
    );
  }

  /* ---- mode: listen and write */
  function renderType(root, item) {
    root.innerHTML =
      '<div class="practice-stage">' + stageHead() +
      '<input class="big-input" data-answer type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' +
      (play.part === "words" ? "type the word" : "type the sentence") + '" aria-label="Your answer">' +
      '<p class="feedback" data-fb aria-live="polite" style="min-height:26px"></p>' +
      '<p class="answer-reveal" data-reveal></p>' +
      '<div class="btn-row" style="justify-content:center;margin-top:12px">' +
      '<button class="btn btn-primary" data-check>Check</button>' +
      '<button class="btn btn-ghost" data-next hidden>Next →</button>' +
      "</div></div>";

    var input = qs("[data-answer]", root);
    input.focus();
    speak(item.plain, 0.8, qs("[data-repeat]", root));

    input.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      var next = qs("[data-next]", root);
      if (next && !next.hidden) next.click(); else qs("[data-check]", root).click();
    });

    qs("[data-check]", root).addEventListener("click", function () { checkTyped(root, item); });
    qs("[data-next]", root).addEventListener("click", nextItem);
  }

  function checkTyped(root, item) {
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
    var close = !exact && stripPunct(given) === stripPunct(item.plain);

    if (exact) {
      fb.className = "feedback ok";
      fb.textContent = "✓ Correct!";
      reveal.className = "answer-reveal ok";
      reveal.textContent = "";
      play.score += 1;
      Store.addCoins(2);
      if (play.part === "words") Store.markMastered(play.chapter, item.n);
      confetti.from(qs("[data-check]", root), 26);
    } else if (close) {
      fb.className = "feedback warn";
      fb.textContent = "✓ Right words — but check the capital letters and the full stop.";
      reveal.className = "answer-reveal";
      reveal.textContent = "Answer: " + item.plain;
      play.score += 1;
      Store.addCoins(1);
    } else {
      fb.className = "feedback no";
      fb.textContent = "✗ Not quite.";
      reveal.className = "answer-reveal no";
      reveal.textContent = "Answer: " + item.plain;
    }

    if (!exact) speak(item.plain, 0.75, null);

    input.disabled = true;
    qs("[data-check]", root).disabled = true;
    var next = qs("[data-next]", root);
    next.hidden = false;
    next.textContent = play.idx + 1 >= total() ? "See the score →" : "Next →";
    next.focus();
  }

  /* ---- mode: build it */
  var buildState = null;

  function renderBuild(root, item) {
    var parts = splitArticle(item.plain);
    var letters = parts.rest.split("");
    buildState = {
      answer: parts.rest,
      article: parts.article,
      pool: shuffle(letters.map(function (ch, i) { return { ch: ch, i: i }; })),
      placed: [],
      locked: false
    };

    root.innerHTML =
      '<div class="practice-stage">' + stageHead() +
      '<p class="hint" data-status>Tap the letters in order.</p>' +
      '<div class="slots" data-slots>' +
      (parts.article ? '<span class="article-chip">' + esc(parts.article) + "</span>" : "") +
      letters.map(function () { return '<span class="slot"></span>'; }).join("") +
      "</div>" +
      '<div class="tiles" data-tiles>' +
      buildState.pool.map(function (t, k) {
        return '<button class="tile-letter" data-tile="' + k + '">' + esc(t.ch) + "</button>";
      }).join("") +
      "</div>" +
      '<p class="feedback" data-fb aria-live="polite" style="min-height:24px"></p>' +
      '<div class="btn-row" style="justify-content:center;margin-top:8px">' +
      '<button class="btn btn-ghost" data-undo>↩ Undo</button>' +
      '<button class="btn btn-ghost" data-next hidden>Next →</button>' +
      "</div></div>";

    speak(item.plain, 0.8, qs("[data-repeat]", root));

    qs("[data-tiles]", root).addEventListener("click", function (ev) {
      var btn = ev.target.closest(".tile-letter");
      if (!btn || !buildState || buildState.locked) return;
      var k = Number(btn.getAttribute("data-tile"));
      placeLetter(root, btn, k);
    });

    qs("[data-undo]", root).addEventListener("click", function () {
      if (!buildState || buildState.locked || !buildState.placed.length) return;
      var last = buildState.placed.pop();
      var btn = qs('[data-tile="' + last + '"]', root);
      if (btn) btn.classList.remove("used");
      var slots = qsa(".slot", qs("[data-slots]", root));
      var slot = slots[buildState.placed.length];
      if (slot) { slot.textContent = ""; slot.className = "slot"; }
      qs("[data-fb]", root).textContent = "";
    });

    qs("[data-next]", root).addEventListener("click", nextItem);
  }

  function placeLetter(root, btn, k) {
    var st = buildState;
    var ch = st.pool[k].ch;
    st.placed.push(k);
    btn.classList.add("used");

    var slots = qsa(".slot", qs("[data-slots]", root));
    var slot = slots[st.placed.length - 1];
    if (slot) { slot.textContent = ch; slot.classList.add("filled"); }

    if (st.placed.length === st.answer.length) checkBuilt(root, slots);
  }

  function checkBuilt(root, slots) {
    var st = buildState;
    st.locked = true;
    var attempt = st.placed.map(function (k) { return st.pool[k].ch; }).join("");
    var fb = qs("[data-fb]", root);

    if (attempt === st.answer) {
      slots.forEach(function (s) { s.classList.add("right"); });
      fb.className = "feedback ok";
      fb.textContent = "✓ " + st.answer + " — that is it!";
      play.score += 1;
      Store.addCoins(2);
      Store.markMastered(play.chapter, play.items[play.idx].n);
      confetti.from(qs("[data-slots]", root), 34);
      speak(play.items[play.idx].plain, 0.85, null);
      var next = qs("[data-next]", root);
      next.hidden = false;
      next.textContent = play.idx + 1 >= total() ? "See the score →" : "Next →";
      next.focus();
    } else {
      slots.forEach(function (s) { s.classList.add("wrong"); });
      fb.className = "feedback no";
      fb.textContent = "✗ Not that order. Have another go.";
      qs("[data-slots]", root).classList.add("shake");
      setTimeout(function () {
        qs("[data-slots]", root).classList.remove("shake");
        st.locked = false;
        st.placed = [];
        slots.forEach(function (s) { s.textContent = ""; s.className = "slot"; });
        qsa(".tile-letter", root).forEach(function (b) { b.classList.remove("used"); });
        fb.textContent = "";
      }, 950);
    }
  }

  /* ---- mode: tap the word */
  function renderTap(root, item) {
    var ch = DICT[play.chapter];
    var others = ch.words
      .filter(function (w) { return w.plain !== item.plain; })
      .map(function (w) { return w.plain; });
    var options = shuffle([item.plain].concat(shuffle(others).slice(0, 3)));

    root.innerHTML =
      '<div class="practice-stage">' + stageHead() +
      '<p class="hint">Which one did you hear?</p>' +
      '<div class="choices" data-choices>' +
      options.map(function (o) {
        return '<button class="choice" data-choice="' + esc(o) + '">' + esc(o) + "</button>";
      }).join("") +
      "</div>" +
      '<p class="feedback" data-fb aria-live="polite" style="min-height:26px"></p>' +
      '<div class="btn-row" style="justify-content:center;margin-top:10px">' +
      '<button class="btn btn-ghost" data-next hidden>Next →</button>' +
      "</div></div>";

    speak(item.plain, 0.8, qs("[data-repeat]", root));

    qs("[data-choices]", root).addEventListener("click", function (ev) {
      var btn = ev.target.closest(".choice");
      if (!btn || btn.disabled) return;
      var picked = btn.getAttribute("data-choice");
      var fb = qs("[data-fb]", root);
      var right = picked === item.plain;

      qsa(".choice", root).forEach(function (b) { b.disabled = true; });
      btn.classList.add(right ? "right" : "wrong");
      if (!right) {
        var correct = qs('[data-choice="' + CSS.escape(item.plain) + '"]', root);
        if (correct) correct.classList.add("right");
      }

      if (right) {
        fb.className = "feedback ok";
        fb.textContent = "✓ Yes — " + item.plain;
        play.score += 1;
        Store.addCoins(2);
        Store.markMastered(play.chapter, item.n);
        confetti.from(btn, 26);
      } else {
        fb.className = "feedback no";
        fb.textContent = "✗ It was “" + item.plain + "”.";
      }

      var next = qs("[data-next]", root);
      next.hidden = false;
      next.textContent = play.idx + 1 >= total() ? "See the score →" : "Next →";
      next.focus();
    });

    qs("[data-next]", root).addEventListener("click", nextItem);
  }

  function nextItem() {
    play.idx += 1;
    if (play.idx >= play.items.length) finish(); else renderItem();
  }

  function finish() {
    var root = playRoot();
    var score = play.score;
    var t = total();
    var key = bestKey();
    var store = Store.read();
    var prev = store.best[key] || 0;

    if (score > prev) {
      var best = Object.assign({}, store.best);
      best[key] = score;
      Store.write({ best: best });
    }
    Store.addCoins(score);

    var stars = score >= t ? "⭐⭐⭐" : score >= t - 2 ? "⭐⭐" : score >= t / 2 ? "⭐" : "";
    var line = score >= t ? "Perfect. That is dictation-ready."
      : score >= t - 2 ? "Strong. Fix the two or three misses and he is there."
      : score >= t / 2 ? "Halfway. Go back to the word cards for the misses."
      : "Early days. Read the words out loud together first, then try again.";

    root.innerHTML =
      '<div class="practice-stage">' +
      '<p class="kicker">Result</p>' +
      '<p class="score-big">' + score + " / " + t + "</p>" +
      '<p class="stars">' + stars + "</p>" +
      '<p class="lede">' + line + "</p>" +
      (prev ? '<p class="hint" style="margin-top:6px">Best before this: ' + prev + " / " + t + "</p>" : "") +
      '<div class="btn-row" style="justify-content:center;margin-top:20px">' +
      '<button class="btn btn-primary" data-again>Play again</button>' +
      '<button class="btn btn-ghost" data-words>Back to the words</button>' +
      "</div></div>";

    qs("[data-words]", root).addEventListener("click", function () {
      window.location.href = "../" + play.chapter + "/";
    });
    qs("[data-again]", root).addEventListener("click", renderPlaySetup);

    if (score >= t - 2) {
      confetti.shoot(window.innerWidth * 0.5, window.innerHeight * 0.32, 70);
      setTimeout(function () { confetti.shoot(window.innerWidth * 0.2, window.innerHeight * 0.3, 40); }, 220);
      setTimeout(function () { confetti.shoot(window.innerWidth * 0.8, window.innerHeight * 0.3, 40); }, 420);
    }

    speak(score >= t - 2 ? "Well done, Anton!" : "Good try. Let us look at the tricky ones.", 0.9, null);
  }

  function renderPlay() {
    var params = new URLSearchParams(window.location.search);
    var ch = params.get("ch");
    var mode = params.get("mode");
    var part = params.get("part");
    if (ch && DICT[ch]) play.chapter = ch;
    if (mode && ["type", "build", "tap"].indexOf(mode) >= 0) play.mode = mode;
    if (part === "words" || part === "sentences") play.part = part;
    renderPlaySetup();
  }

  function wirePlay() {
    document.addEventListener("click", function (ev) {
      var root = playRoot();
      if (!root) return;
      var m = ev.target.closest("[data-set-mode]");
      if (m) { play.mode = m.getAttribute("data-set-mode"); renderPlaySetup(); return; }
      var c = ev.target.closest("[data-set-ch]");
      if (c) { play.chapter = c.getAttribute("data-set-ch"); renderPlaySetup(); return; }
      var p = ev.target.closest("[data-set-part]");
      if (p) { play.part = p.getAttribute("data-set-part"); renderPlaySetup(); return; }
      if (ev.target.closest("[data-start]")) startPlay();
    });
  }

  /* ------------------------------------------------------------ voice pick */

  function paintVoicePicker(host) {
    if (!host) return;
    var list = englishVoices().map(function (v) {
      return { v: v, s: scoreFemale(v) };
    }).sort(function (a, b) { return b.s - a.s; });

    if (!list.length) {
      host.innerHTML = "<span>Voices load after the first tap.</span>";
      return;
    }

    var chosen = bestFemaleVoice();
    var opts = list.slice(0, 12).map(function (item) {
      var v = item.v;
      return '<option value="' + esc(v.voiceURI) + '"' +
        (chosen && chosen.voiceURI === v.voiceURI ? " selected" : "") + ">" +
        esc(v.name) + " (" + esc(v.lang) + ")" +
        (nameLooksFemale(v) ? " ♀" : "") + "</option>";
    }).join("");

    var femaleCount = list.filter(function (i) { return nameLooksFemale(i.v); }).length;

    host.innerHTML =
      '<label for="voiceSel">Voice</label>' +
      '<select id="voiceSel" data-voice-select>' + opts + "</select>" +
      '<button class="chip" data-say="Hello Anton. Let us do your dictation." data-rate="0.9">🔊 Try it</button>' +
      (femaleCount === 0 ? '<span style="width:100%;text-align:center;font-size:12px">' +
        "No clearly female voice on this device — pick the one that sounds best.</span>" : "");

    qs("[data-voice-select]", host).addEventListener("change", function (ev) {
      Store.write({ voiceURI: ev.target.value });
      speak("Hello Anton. Let us do your dictation.", 0.9, null);
    });
  }

  /* ------------------------------------------------------------------ plan */

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
          '<td><button class="tick' + (done ? " on" : "") + '" data-tick="' + key +
          '" aria-label="Mark done" aria-pressed="' + done + '">' + (done ? "✓" : "") + "</button></td>" +
          "</tr>"
        );
      }).join("");
    });
  }

  function wireTicks() {
    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-tick]");
      if (!btn) return;
      var key = btn.getAttribute("data-tick");
      var res = Store.toggleTick(key);
      var on = !!res.ticks[key];
      btn.classList.toggle("on", on);
      btn.textContent = on ? "✓" : "";
      btn.setAttribute("aria-pressed", String(on));
      if (on) confetti.from(btn, 16);
    });
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    paintCoins();
    paintCountdowns();
    onSpeak(document);
    wireTicks();
    wirePlay();

    window.addEventListener("pointerdown", primeSpeech, { once: true });

    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", function () {
        var host = qs("[data-voice-picker]");
        if (host) paintVoicePicker(host);
      });
    }

    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHome();
    if (page === "chapter") renderChapter();
    if (page === "play") renderPlay();
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
