"""
emotion_engine.py
=================
Advanced emotion tagging for Fish Audio s2.1-pro-free.

The model reads inline [tags] written in natural language directly inside
the text. Tags are stripped from clean_text saved in the timing JSON so
word highlighting still maps to the correct displayed words.

Covers all three WAEC/JAMB question types:
  Objective  -- MCQ with options A/B/C/D
  Theory     -- long structured essay/short-answer, no options
  Practical  -- lab/field scenario, may or may not have options

Each piece of text is analysed at THREE layers:

  Layer 1: Audio type role
      q    -> quiz-host / examiner voice
      opts -> neutral referee (no option should sound "correct")
      exp  -> warm teacher / model answer walkthrough

  Layer 2: Content signals
      Detects: subject domain, question stem type (definition, calculation,
      negative stem, comparison, scenario, fill-blank, "which of the following"),
      theory structure (numbered list, "describe/explain/discuss/state"),
      practical structure (lab observation, specimen, procedure)

  Layer 3: Sentence-level micro-emotions (explanations only)
      Injected between sentences for natural variation:
      key insight, example, contrast, formula result, encouragement

Public API
----------
    add_emotion(text, audio_type, question_data) -> str
        Returns text with emotion tags prepended / injected.
        Sent to Fish Audio only -- never stored in timing JSON.

    strip_emotion_tags(text) -> str
        Remove all [tag] blocks.
        Use before saving clean_text to timing JSON.
"""

from __future__ import annotations

import re


# =====================================================================
# Emotion tag library
# =====================================================================

class _T:
    # ------------------------------------------------------------------
    # OBJECTIVE question stems
    # ------------------------------------------------------------------
    Q_STANDARD      = "[natural conversational tone, breathing normally, like a real person reading aloud]"
    Q_WHICH_OF      = "[bright and engaged, slight forward lean in the voice, natural breath before starting]"
    Q_NEGATIVE      = "[deliberate and careful, natural pause before stressing NOT or EXCEPT, real human pacing]"
    Q_CALCULATION   = "[focused and precise, slight breath before numbers, like a teacher working through it]"
    Q_DEFINITION    = "[clear and calm, authoritative but warm, natural reading pace with gentle breath]"
    Q_FILL_BLANK    = "[measured pace, natural pause and slight breath at the blank space]"
    Q_COMPARISON    = "[thoughtful and natural, weighing both sides, slight inhale before each contrasted idea]"
    Q_SCENARIO      = "[warm storytelling voice, relaxed natural breathing, painting a clear picture]"
    Q_SHORT_PUNCHY  = "[sharp and direct, quick natural breath before delivering, energetic but human]"
    Q_LONG_STEM     = "[steady patient voice, natural breath at commas and clauses, careful human pacing]"
    Q_TRICK         = "[alert and careful, slight inhale of surprise, a raised eyebrow you can hear]"
    Q_SCIENCE       = "[curious and exploratory, natural breath, science-documentary warmth]"
    Q_HISTORY       = "[measured and authoritative, slightly formal, natural human cadence]"
    Q_NOVEL_LIT     = "[warm and reflective, like discussing a favourite book with a friend, natural breath]"
    Q_ECONOMICS     = "[composed and professional, natural breath, business presenter warmth]"
    Q_GEOGRAPHY     = "[observational and descriptive, relaxed outdoor voice, natural human pace]"
    Q_ART_MUSIC     = "[expressive and appreciative, slightly slower natural breath, creative warmth]"

    # ------------------------------------------------------------------
    # THEORY question stems
    # ------------------------------------------------------------------
    TH_DESCRIBE     = "[examiner voice, natural breath before speaking, clear and deliberate, inviting a full answer]"
    TH_EXPLAIN      = "[warm professor tone, slight thoughtful inhale before the question, intellectually curious]"
    TH_DISCUSS      = "[balanced and open, gentle breath, setting up a two-sided discussion naturally]"
    TH_STATE        = "[crisp and direct, short breath, expecting a precise factual answer]"
    TH_OUTLINE      = "[methodical and calm, natural breath between points, one idea at a time]"
    TH_COMPARE      = "[analytical, natural inhale, placing two ideas side by side thoughtfully]"
    TH_EVALUATE     = "[thoughtful and reflective, slow natural breath, weighing pros and cons]"
    TH_CALCULATE    = "[precise and step-by-step, careful breath before each number, every step matters]"
    TH_DRAW_LABEL   = "[instructional and calm, natural even breathing, clear and systematic]"
    TH_SUGGEST      = "[open and inviting, relaxed breath, leaving room for creative thinking]"
    TH_STANDARD     = "[clear examiner voice, natural breathing, formal but warm and accessible]"

    # ------------------------------------------------------------------
    # PRACTICAL question stems
    # ------------------------------------------------------------------
    PR_SPECIMEN     = "[observational and scientific, calm natural breath, like a lab instructor beside you]"
    PR_PROCEDURE    = "[step-by-step instructional, clear natural breath between steps, calm and safe]"
    PR_OBSERVATION  = "[attentive and precise, slight inhale of focus, noticing every detail]"
    PR_INFERENCE    = "[analytical and curious, thoughtful breath, drawing conclusions from evidence]"
    PR_FIELD        = "[outdoor exploratory voice, relaxed natural breathing, engaged with the environment]"
    PR_CALCULATION  = "[careful and methodical, natural breath before results, lab-notebook precision]"
    PR_STANDARD     = "[calm scientific voice, natural even breathing, focused and factual]"

    # ------------------------------------------------------------------
    # OPTIONS
    # ------------------------------------------------------------------
    OPTS_STANDARD   = "[neutral and even delivery, natural breath before each option, every choice sounds equally possible]"
    OPTS_SHORT      = "[crisp and clear, quick natural breath between options, equal weight on each]"
    OPTS_NUMBERS    = "[precise and measured, gentle breath before each number, reading each value clearly]"
    OPTS_LONG       = "[patient steady pace, natural breath between options, clear human delivery]"
    OPTS_SIMILAR    = "[careful and deliberate, slight pause and breath between similar-sounding choices]"

    # ------------------------------------------------------------------
    # EXPLANATION / MODEL ANSWER opening tags
    # ------------------------------------------------------------------
    EXP_STANDARD    = "[warm encouraging teacher voice, gentle breath after revealing the answer, natural and human]"
    EXP_MATH        = "[calm and methodical, careful breath before each step, walking through it naturally]"
    EXP_DEFINITION  = "[clear and informative, natural breath, like a knowledgeable friend explaining]"
    EXP_STORY       = "[conversational and warm, relaxed natural breathing, making it easy and memorable]"
    EXP_SCIENCE     = "[fascinated and clear, slight excited breath, like sharing a cool discovery]"
    EXP_LONG        = "[patient and thorough, natural breath at paragraph breaks, taking each point carefully]"
    EXP_SHORT       = "[bright and encouraging, quick warm breath, short and reassuring delivery]"
    EXP_TRICKY      = "[gentle and reassuring, slight empathetic breath -- acknowledging this one was tough]"
    EXP_THEORY_LONG = "[model-answer voice, natural breath between points, structured but approachable]"
    EXP_PRACTICAL   = "[lab-tutor voice, calm natural breathing, systematic and precise]"
    EXP_NUMBERED    = "[reading a structured list, natural breath and pause between each numbered point]"

    # ------------------------------------------------------------------
    # Sentence-level micro tags (injected between sentences in exp)
    # ------------------------------------------------------------------
    M_KEY       = " [inhale, with gentle emphasis] "
    M_EXAMPLE   = " [slight breath, illustrative and conversational] "
    M_CONTRAST  = " [short pause, slightly more serious tone] "
    M_FORMULA   = " [careful breath, precise and measured] "
    M_ENCOURAGE = " [warm natural breath, encouraging and supportive] "
    M_NUMBERED  = " [breath, next point, clear natural pause] "

    # ------------------------------------------------------------------
    # Breathing / prosody markers (inserted into text directly)
    # ------------------------------------------------------------------
    BREATH_START  = "[inhale] "        # natural breath before a long read
    BREATH_PAUSE  = " [pause] "        # thinking pause at transitions
    BREATH_SIGH   = " [sigh] "         # relief / after a hard explanation
    BREATH_HMM    = " [hmm] "          # thoughtful moment before insight
    BREATH_LIGHT  = " [breath] "       # light breath mid-sentence


# =====================================================================
# Content signal helpers
# =====================================================================

def _has(text: str, *phrases: str) -> bool:
    tl = text.lower()
    return any(p.lower() in tl for p in phrases)


def _wc(text: str) -> int:
    return len(text.split())


# =====================================================================
# Layer 2 detectors
# =====================================================================

def _detect_question_tag(text: str, subject: str, qtype: str) -> str:
    """Pick the right opening emotion tag for a question stem."""
    tl   = text.lower()
    subj = (subject or "").lower()
    wc   = _wc(text)

    # ---------- THEORY stems ----------
    if qtype == "theory":
        if _has(tl, "describe", "describe the"):
            return _T.TH_DESCRIBE
        if _has(tl, "explain", "explain why", "explain how"):
            return _T.TH_EXPLAIN
        if _has(tl, "discuss", "discuss the"):
            return _T.TH_DISCUSS
        if re.match(r"^(state|list|name|give|write|mention)\b", tl):
            return _T.TH_STATE
        if _has(tl, "outline", "briefly outline"):
            return _T.TH_OUTLINE
        if _has(tl, "compare", "contrast", "difference between",
                 "distinguish between"):
            return _T.TH_COMPARE
        if _has(tl, "evaluate", "assess", "critically"):
            return _T.TH_EVALUATE
        if re.search(r"\b(calculate|compute|find|determine|what is the value)\b", tl):
            return _T.TH_CALCULATE
        if _has(tl, "draw", "sketch", "label", "diagram"):
            return _T.TH_DRAW_LABEL
        if _has(tl, "suggest", "recommend", "propose"):
            return _T.TH_SUGGEST
        return _T.TH_STANDARD

    # ---------- PRACTICAL stems ----------
    if qtype == "practical":
        if _has(tl, "specimen", "sample", "observe", "identify the"):
            return _T.PR_SPECIMEN
        if _has(tl, "procedure", "method", "steps", "how would you",
                 "describe how"):
            return _T.PR_PROCEDURE
        if _has(tl, "observation", "what did you observe", "result",
                 "what is observed"):
            return _T.PR_OBSERVATION
        if _has(tl, "inference", "conclude", "deduce", "what can you infer"):
            return _T.PR_INFERENCE
        if _has(tl, "field", "farm", "plot", "visit", "site"):
            return _T.PR_FIELD
        if re.search(r"\b(calculate|compute|find|measure)\b", tl):
            return _T.PR_CALCULATION
        return _T.PR_STANDARD

    # ---------- OBJECTIVE stems ----------
    # Negative stem -- most important first
    if re.search(r"\b(not|except|least|incorrect|false|wrong)\b", tl):
        return _T.Q_NEGATIVE

    # Calculation
    if re.search(r"\d[\d,]*(\.\d+)?\s*(naira|%|kg|cm|km|ml|mol)", tl) or \
       _has(tl, "calculate", "compute", "find the", "what is the value",
            "cost of", "total", "how much", "how many"):
        if _has(subj, "math", "account", "physics", "chemistry",
                "costing", "financial"):
            return _T.Q_CALCULATION

    # Definition
    if re.search(r"\b(define|definition|term|referred to as|known as|"
                 r"called|is used to refer|what is meant by)\b", tl):
        return _T.Q_DEFINITION

    # Fill-in-the-blank
    if re.search(r"_{2,}|\.{3,}|<blank>|\[blank\]", tl):
        return _T.Q_FILL_BLANK

    # Which of the following
    if _has(tl, "which of the following", "which one of"):
        return _T.Q_WHICH_OF

    # Comparison
    if _has(tl, "difference between", "distinguish", "compare",
             "major difference", "distinguish between"):
        return _T.Q_COMPARISON

    # Scenario / story setup
    if re.search(r"\b(company|business|shop|farmer|student|person|"
                 r"bought|sold|invested|borrowed|conducted|observed)\b",
                 tl) and wc > 18:
        return _T.Q_SCENARIO

    # Subject-specific
    if _has(subj, "biology", "chemistry", "physics", "science",
            "integrated", "fisheries", "forestry", "animal"):
        return _T.Q_SCIENCE
    if _has(subj, "history", "government", "social"):
        return _T.Q_HISTORY
    if _has(subj, "novel", "literature", "english language"):
        return _T.Q_NOVEL_LIT
    if _has(subj, "economics", "financial", "accounting", "cost",
            "business", "commerce"):
        return _T.Q_ECONOMICS
    if _has(subj, "geography"):
        return _T.Q_GEOGRAPHY
    if _has(subj, "music", "art", "graphic", "picture", "sculpture",
            "textiles", "ceramics"):
        return _T.Q_ART_MUSIC

    # Length-based fallbacks
    if wc <= 10:
        return _T.Q_SHORT_PUNCHY
    if wc >= 45:
        return _T.Q_LONG_STEM
    return _T.Q_STANDARD


def _detect_options_tag(options: list[dict]) -> str:
    """Pick the right options emotion tag."""
    if not options:
        return _T.OPTS_STANDARD

    texts   = [o.get("text", "") or "" for o in options]
    avg_len = sum(len(t) for t in texts) / max(len(texts), 1)

    # All purely numeric / currency options
    if all(re.match(r"^[\d,.\-\s]*(naira|%|kg|cm|km|ml|mol|x\s*10)?$",
                    t.strip(), re.I) for t in texts if t.strip()):
        return _T.OPTS_NUMBERS

    # Highly overlapping options (same words, different endings)
    all_words    = []
    unique_words = set()
    for t in texts:
        words = t.lower().split()
        all_words.extend(words)
        unique_words.update(words)
    if all_words:
        overlap = 1 - len(unique_words) / len(all_words)
        if overlap > 0.45:
            return _T.OPTS_SIMILAR

    if avg_len < 20:
        return _T.OPTS_SHORT
    if avg_len > 80:
        return _T.OPTS_LONG
    return _T.OPTS_STANDARD


def _detect_explanation_tag(text: str, subject: str,
                             qtype: str, is_trick: bool) -> str:
    """Pick the right explanation / model-answer emotion tag."""
    tl   = text.lower()
    subj = (subject or "").lower()
    wc   = _wc(text)

    if is_trick:
        return _T.EXP_TRICKY

    # Numbered list structure -- theory model answers often start "1. ..."
    if re.search(r"(^|\n)\s*\d+[\.\)]", text) or \
       _has(tl, "1.", "firstly", "first,", "step 1"):
        if wc > 60:
            return _T.EXP_NUMBERED

    if qtype == "practical":
        return _T.EXP_PRACTICAL

    if qtype == "theory" and wc > 60:
        return _T.EXP_THEORY_LONG

    # Math / calculation walkthrough
    if re.search(r"=\s*[\d,]+|step\s*\d|formula|equation|therefore\s+\w+\s*=",
                 tl):
        return _T.EXP_MATH

    if wc <= 25:
        return _T.EXP_SHORT
    if wc >= 100:
        return _T.EXP_LONG

    if _has(subj, "biology", "chemistry", "physics", "science",
            "integrated", "fisheries"):
        return _T.EXP_SCIENCE
    if _has(tl, "story", "novel", "character", "author", "passage"):
        return _T.EXP_STORY
    if _has(tl, "is defined as", "refers to", "is the process",
             "is a type of", "is used to"):
        return _T.EXP_DEFINITION

    return _T.EXP_STANDARD


# =====================================================================
# Layer 3: sentence-level micro-emotion injector
# =====================================================================

def _inject_micro_emotions(text: str, qtype: str) -> str:
    """
    Split explanation into sentences and inject micro-emotion + breathing tags
    at natural transition points to make delivery feel dynamic and human.
    Only applied to explanations.
    """
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= 2:
        return text

    result: list[str] = []

    for i, sent in enumerate(sentences):
        sl = sent.lower().strip()

        if i == 0:
            result.append(sent)
            continue

        # Numbered list item (theory model answers)
        if re.match(r"^\d+[\.\)]", sent.strip()):
            result.append(_T.M_NUMBERED + sent)
            continue

        # Contrast / counterpoint
        if re.match(r"^(however|but|although|while|whereas|on the other hand|"
                    r"in contrast|nevertheless|yet)\b", sl):
            result.append(_T.M_CONTRAST + sent)
            continue

        # Example
        if re.match(r"^(for example|for instance|such as|this can be seen|"
                    r"consider|take|imagine|e\.g\.)", sl):
            result.append(_T.M_EXAMPLE + sent)
            continue

        # Formula / equation result
        if re.search(r"=\s*[\d,.()]+\s*$", sent) or \
           re.search(r"therefore\s+\w+\s*=", sl):
            result.append(_T.M_FORMULA + sent)
            continue

        # Key conclusion — add a thinking [hmm] before insight sentences
        if re.match(r"^(this means|this implies|this shows|this is why|"
                    r"remember|note that|importantly|the key|in summary|"
                    r"therefore|hence)\b", sl):
            result.append(_T.BREATH_HMM + _T.M_KEY + sent)
            continue

        # Final encouraging sentence
        if i == len(sentences) - 1 and \
           re.search(r"(always|remember|keep in mind|tip|trick|easy way|"
                     r"a good way to recall)", sl):
            result.append(_T.M_ENCOURAGE + sent)
            continue

        # Long sentences get a light mid-breath (every ~5 sentences)
        if i % 5 == 0 and len(sent.split()) > 12:
            result.append(_T.BREATH_LIGHT + sent)
            continue

        result.append(sent)

    return " ".join(result)


# =====================================================================
# Public API
# =====================================================================

def _inject_breathing(text: str, wc: int) -> str:
    """
    Insert [inhale] at the very start of longer texts, and [breath] at
    natural paragraph / clause boundaries.  Short texts get no markers.
    """
    if wc < 12:
        return text                     # too short — no breathing needed

    # Always start a long read with a natural inhale
    text = _T.BREATH_START + text

    # Insert [breath] before long subordinate clauses (after comma-chains)
    # This mimics real speakers pausing to breathe mid-sentence
    if wc > 40:
        # Breath after the third comma in very long texts
        parts = text.split(",")
        if len(parts) > 4:
            parts[3] = _T.BREATH_LIGHT.rstrip() + "," + parts[3]
            text = ",".join(parts)

    return text


def add_emotion(
    text:          str,
    audio_type:    str,
    question_data: dict | None = None,
) -> str:
    """
    Add emotion + breathing/prosody tags to text before sending to Fish Audio.

    Parameters
    ----------
    text          : clean TTS-ready text (output of text_cleaner)
    audio_type    : "q" | "opts" | "exp"
    question_data : raw question dict from the JSON file

    Returns
    -------
    Tagged text string -- sent to Fish Audio only, NOT saved to timing JSON.
    """
    if not text or not text.strip():
        return text

    q      = question_data or {}
    subj   = q.get("subject", "") or ""
    qt_raw = q.get("question_text", "") or ""
    opts   = q.get("options", []) or []
    qtype  = (q.get("question_type") or "objective").lower()
    # Normalise to "objective" / "theory" / "practical"
    if qtype not in ("theory", "practical"):
        qtype = "objective"

    is_trick = bool(re.search(
        r"\b(not|except|incorrect|false|wrong|least)\b",
        qt_raw.lower()
    ))

    wc = _wc(text)

    if audio_type == "q":
        tag = _detect_question_tag(text, subj, qtype)
        breathed = _inject_breathing(text, wc)
        return f"{tag} {breathed}"

    elif audio_type == "opts":
        tag = _detect_options_tag(opts)
        # Options: just a light breath before each block, no full breathing pass
        return f"{tag} {text}"

    elif audio_type == "exp":
        tag    = _detect_explanation_tag(text, subj, qtype, is_trick)
        tagged = _inject_micro_emotions(text, qtype)
        breathed = _inject_breathing(tagged, wc)
        # Add a relief [sigh] after very long explanations
        if wc > 80:
            breathed = breathed + _T.BREATH_SIGH
        return f"{tag} {breathed}"

    return text


def strip_emotion_tags(text: str) -> str:
    """Remove all [tag] blocks from text for storage in timing JSON."""
    return re.sub(r"\[([^\]]+)\]\s*", "", text).strip()


# =====================================================================
# CLI preview
# =====================================================================

if __name__ == "__main__":
    import json, sys
    from pathlib import Path
    from text_cleaner import clean_for_tts, build_options_speech

    default = (
        Path(__file__).parent.parent.parent
        / "new_staging_area/gh/exams/high_school_graduate/waec"
        / "agricultural_science/theory/2000.json"
    )
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else default
    data = json.loads(path.read_text(encoding="utf-8"))

    sep = "-" * 72
    for qid, q in list(data.items())[:4]:
        qt   = clean_for_tts(q.get("question_text", "") or "")
        opts = build_options_speech(q.get("options", []) or [])
        exp  = clean_for_tts(q.get("explanation", "") or "")
        qtype = (q.get("question_type") or "objective").lower()

        print(f"\n{sep}")
        print(f"Q{q.get('order_id')} | {qtype.upper()} | {q.get('subject','')}")
        print(f"\n  Q RAW : {qt[:90]}")
        print(f"  Q EMO : {add_emotion(qt, 'q', q)[:110]}")
        if opts.strip():
            print(f"\n  O RAW : {opts[:90]}")
            print(f"  O EMO : {add_emotion(opts, 'opts', q)[:110]}")
        if exp.strip():
            print(f"\n  E RAW : {exp[:90]}")
            print(f"  E EMO : {add_emotion(exp, 'exp', q)[:200]}")
    print(f"\n{sep}")
