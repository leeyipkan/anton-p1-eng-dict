/* Dictation content — taken word for word from the school sheets (p.2 and p.3).
   parts: [text, isTricky] so the tricky grapheme can be coloured. */

window.DICT = {
  ch5: {
    id: "ch5",
    label: "Chapter 5",
    date: "2026-11-11",
    dateLabel: "Wednesday 11 November 2026",
    confirmed: true,
    words: [
      { n: 1, plain: "an ear", parts: [["an ", 0], ["e", 1], ["a", 1], ["r", 0]], syll: "an · ear", tip: "ea says “ee”", say: "eer" },
      { n: 2, plain: "thin", parts: [["th", 1], ["in", 0]], syll: "thin", tip: "th — tongue between the teeth", say: "thin" },
      { n: 3, plain: "a leg", parts: [["a ", 0], ["leg", 0]], syll: "a · leg", tip: "short “e”, like bed", say: "leg" },
      { n: 4, plain: "tall", parts: [["ta", 0], ["ll", 1]], syll: "tall", tip: "two l’s at the end", say: "tawl" },
      { n: 5, plain: "an arm", parts: [["an ", 0], ["ar", 1], ["m", 0]], syll: "an · arm", tip: "ar says “ah”", say: "ahm" },
      { n: 6, plain: "a mouth", parts: [["a ", 0], ["m", 0], ["ou", 1], ["th", 0]], syll: "a · mouth", tip: "ou says “ow”", say: "mowth" },
      { n: 7, plain: "a foot", parts: [["a ", 0], ["f", 0], ["oo", 1], ["t", 0]], syll: "a · foot", tip: "two o’s, short “u” sound", say: "fut" },
      { n: 8, plain: "shoulders", parts: [["sh", 0], ["oul", 1], ["ders", 0]], syll: "shoul · ders", tip: "the hard one: sh + oul + ders", say: "SHOLE-derz" }
    ],
    sentences: [
      { n: 1, plain: "Pat is looking for her cat.", parts: [["Pat is ", 0], ["looking", 1], [" for her cat.", 0]] },
      { n: 2, plain: "Can you help me?", parts: [["Can you ", 0], ["help", 1], [" me", 0], ["?", 1]] },
      { n: 3, plain: "Who is that?", parts: [["Who", 1], [" is that", 0], ["?", 1]] },
      { n: 4, plain: "He has short hair and big eyes.", parts: [["He has short ", 0], ["hair", 1], [" and big ", 0], ["eyes", 1], [".", 0]] },
      { n: 5, plain: "He is very fat.", parts: [["He is ", 0], ["very", 1], [" fat.", 0]] },
      { n: 6, plain: "He is a naughty boy.", parts: [["He is a ", 0], ["naughty", 1], [" boy.", 0]] },
      { n: 7, plain: "He does not have a small nose.", parts: [["He ", 0], ["does", 1], [" not have a ", 0], ["small", 1], [" nose.", 0]] },
      { n: 8, plain: "You are a good boy!", parts: [["You are a ", 0], ["good", 1], [" boy", 0], ["!", 1]] }
    ],
    plan: [
      { date: "2026-11-07", when: "Sat 7 Nov", what: "Meet the words. Say each one three times and point at the orange letters. Read the eight sentences aloud together — no writing yet." },
      { date: "2026-11-08", when: "Sun 8 Nov", what: "Look–Cover–Write–Check all eight words. Copy sentences 1–4." },
      { date: "2026-11-09", when: "Mon 9 Nov", what: "Practice test: words 1–8, then sentences 1–4. Mark it together and circle every miss." },
      { date: "2026-11-10", when: "Tue 10 Nov", what: "Only the misses, three times each. Then one more full test. Stop while he is still winning." },
      { date: "2026-11-11", when: "Wed 11 Nov", what: "Dictation day. Five-minute warm-up at breakfast, then go and be proud.", final: true }
    ]
  },

  ch6: {
    id: "ch6",
    label: "Chapter 6",
    date: "2026-11-25",
    dateLabel: "Wednesday 25 November 2026",
    confirmed: false,
    words: [
      { n: 1, plain: "dirty", parts: [["d", 0], ["ir", 1], ["ty", 0]], syll: "dir · ty", tip: "ir says “er”", say: "DER-tee" },
      { n: 2, plain: "smelly", parts: [["sme", 0], ["ll", 1], ["y", 0]], syll: "smell · y", tip: "two l’s, then y", say: "SMELL-ee" },
      { n: 3, plain: "brown", parts: [["br", 0], ["ow", 1], ["n", 0]], syll: "brown", tip: "ow says “ow”", say: "brown" },
      { n: 4, plain: "cute", parts: [["c", 0], ["u", 1], ["t", 0], ["e", 1]], syll: "cute", tip: "magic e: u says “you”", say: "kyoot" },
      { n: 5, plain: "a poster", parts: [["a ", 0], ["post", 0], ["er", 1]], syll: "a · pos · ter", tip: "er says “er”", say: "POH-ster" },
      { n: 6, plain: "perfect", parts: [["p", 0], ["er", 1], ["fect", 0]], syll: "per · fect", tip: "er says “er”", say: "PER-fekt" },
      { n: 7, plain: "sad", parts: [["sad", 0]], syll: "sad", tip: "easy one — you know this", say: "sad" },
      { n: 8, plain: "a duck", parts: [["a ", 0], ["d", 0], ["u", 1], ["ck", 1]], syll: "a · duck", tip: "c + k = ck", say: "duk" }
    ],
    sentences: [
      { n: 1, plain: "They are watching TV.", parts: [["They", 1], [" are ", 0], ["watching", 1], [" ", 0], ["TV", 1], [".", 0]] },
      { n: 2, plain: "I like that horse.", parts: [["I", 1], [" like that ", 0], ["horse", 1], [".", 0]] },
      { n: 3, plain: "It has long legs.", parts: [["It has ", 0], ["long", 1], [" ", 0], ["legs", 1], [".", 0]] },
      { n: 4, plain: "It is a farm animal.", parts: [["It is a ", 0], ["farm", 1], [" ", 0], ["animal", 1], [".", 0]] },
      { n: 5, plain: "Can I have a pig, please?", parts: [["Can I have a pig", 0], [",", 1], [" ", 0], ["please", 1], ["?", 1]] },
      { n: 6, plain: "They go to a pet shop.", parts: [["They", 1], [" go to a pet ", 0], ["shop", 1], [".", 0]] },
      { n: 7, plain: "They have long tails.", parts: [["They", 1], [" have long ", 0], ["tails", 1], [".", 0]] },
      { n: 8, plain: "I like this rabbit.", parts: [["I", 1], [" like this ", 0], ["rabbit", 1], [".", 0]] }
    ],
    plan: [
      { date: "2026-11-14", when: "Sat 14 Nov", what: "Meet the Chapter 6 words. Eight minutes only — keep it light." },
      { date: "2026-11-15", when: "Sun 15 Nov", what: "Rest, or one quick Chapter 5 review." },
      { date: "2026-11-16", when: "Mon 16 Nov", what: "Look–Cover–Write–Check words 1–4. Read all eight sentences aloud." },
      { date: "2026-11-17", when: "Tue 17 Nov", what: "Look–Cover–Write–Check words 5–8. Copy sentences 1–4." },
      { date: "2026-11-18", when: "Wed 18 Nov", what: "Missing-letter sheet. Copy sentences 5–8." },
      { date: "2026-11-19", when: "Thu 19 Nov", what: "Practice test: words 1–8 and sentences 1–4." },
      { date: "2026-11-20", when: "Fri 20 Nov", what: "Mark it. Circle the misses. Write each miss three times." },
      { date: "2026-11-21", when: "Sat 21 Nov", what: "Practice test two: the full paper, words and all sentences." },
      { date: "2026-11-22", when: "Sun 22 Nov", what: "Rest day. No English." },
      { date: "2026-11-23", when: "Mon 23 Nov", what: "The misses only — three times each, said out loud." },
      { date: "2026-11-24", when: "Tue 24 Nov", what: "Final full test. Confidence round — finish on a win." },
      { date: "2026-11-25", when: "Wed 25 Nov", what: "Dictation day. Five-minute warm-up, then go.", final: true }
    ]
  }
};
