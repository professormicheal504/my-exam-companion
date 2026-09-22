"""
text_cleaner.py
===============
Advanced 8-stage HTML → TTS text cleaner for exam question JSON data.

Handles every pattern found across JAMB, Post-UTME, and SAT content:
  - LaTeX math:  \\( \\frac{1}{2} \\)  \\( \\begin{bmatrix}...\\end{bmatrix} \\)
  - HTML entities:  &quot; &#39; &amp; &nbsp; &rArr; &ordm; &prop; &aelig; etc.
  - Currency:  N20,000  #230,000.00  → spoken form
  - Semantic tags:  <br> <ins> <a href> <strong> <em> etc.
  - Unicode math symbols:  ⇒ ∝ ° × ÷ ≥ ≤ √
  - IPA phonetic Unicode (English language questions) → stripped
  - Tabular <br> data → natural sentence flow
  - Reference passages with <b><i><u> highlight markers
  - Options array → "Option A. ... Option B. ..." spoken string

Public API:
    clean_for_tts(raw: str) -> str
    build_options_speech(options: list[dict]) -> str
    build_reference_speech(passage: str) -> str

Run standalone to preview all output:
    python text_cleaner.py path/to/year.json
"""

from __future__ import annotations

import html
import json
import re
import sys
import unicodedata
from pathlib import Path
from html.parser import HTMLParser


# ── Stage 1: LaTeX math → spoken words ────────────────────────────────────────

# Greek letter map used inside LaTeX expressions
_GREEK = {
    r"\alpha": "alpha", r"\beta": "beta", r"\gamma": "gamma",
    r"\delta": "delta", r"\epsilon": "epsilon", r"\zeta": "zeta",
    r"\eta": "eta", r"\theta": "theta", r"\iota": "iota",
    r"\kappa": "kappa", r"\lambda": "lambda", r"\mu": "mu",
    r"\nu": "nu", r"\xi": "xi", r"\pi": "pi", r"\rho": "rho",
    r"\sigma": "sigma", r"\tau": "tau", r"\upsilon": "upsilon",
    r"\phi": "phi", r"\chi": "chi", r"\psi": "psi", r"\omega": "omega",
    r"\Alpha": "Alpha", r"\Beta": "Beta", r"\Gamma": "Gamma",
    r"\Delta": "Delta", r"\Theta": "Theta", r"\Lambda": "Lambda",
    r"\Pi": "Pi", r"\Sigma": "Sigma", r"\Phi": "Phi", r"\Omega": "Omega",
}

# Simple LaTeX command → spoken word (order matters — longest first)
_LATEX_COMMANDS = {
    r"\begin{bmatrix}": " matrix: ", r"\end{bmatrix}": " end matrix ",
    r"\begin{pmatrix}": " matrix: ", r"\end{pmatrix}": " end matrix ",
    r"\begin{vmatrix}": " determinant matrix: ",
    r"\end{vmatrix}": " end determinant matrix ",
    r"\begin{cases}": " cases: ",  r"\end{cases}": " end cases ",
    r"\times":  " times ",     r"\div":    " divided by ",
    r"\cdot":   " times ",     r"\pm":     " plus or minus ",
    r"\mp":     " minus or plus ",
    r"\leq":    " less than or equal to ",
    r"\geq":    " greater than or equal to ",
    r"\neq":    " not equal to ",
    r"\approx": " approximately ",
    r"\equiv":  " is equivalent to ",
    r"\propto": " is proportional to ",
    r"\infty":  " infinity ",
    r"\sqrt":   " square root of ",
    r"\log":    " log ",       r"\ln":     " natural log ",
    r"\sin":    " sine ",      r"\cos":    " cosine ",
    r"\tan":    " tangent ",   r"\cot":    " cotangent ",
    r"\sec":    " secant ",    r"\csc":    " cosecant ",
    r"\rightarrow": " implies ",
    r"\leftarrow":  " is implied by ",
    r"\Rightarrow": " therefore ",
    r"\Leftarrow":  " follows from ",
    r"\leftrightarrow": " if and only if ",
    r"\cap": " intersection ", r"\cup": " union ",
    r"\in":  " in ",           r"\notin": " not in ",
    r"\subset": " subset of ", r"\supset": " superset of ",
    r"\partial": " partial ",  r"\nabla": " nabla ",
    r"\int": " integral ",     r"\sum": " sum ",
    r"\prod": " product ",     r"\lim": " limit ",
    r"\to": " approaches ",    r"\circ": " degrees ",
    r"\%": " percent ",
    r"\\": " ",   # line break inside matrix
    r"\&": " and ",
}


def _latex_inner(expr: str) -> str:
    """Recursively convert LaTeX expression to spoken text."""
    expr = expr.strip()
    if not expr:
        return ""

    # Remove display/inline delimiters if still present
    expr = re.sub(r"^\\\(|\\\)$", "", expr).strip()
    expr = re.sub(r"^\\\[|\\\]$", "", expr).strip()
    expr = re.sub(r"^\$\$|\$\$$", "", expr).strip()
    expr = re.sub(r"^\$|\$$",     "", expr).strip()

    # Greek letters
    for cmd, word in _GREEK.items():
        expr = expr.replace(cmd, f" {word} ")

    # Named LaTeX commands
    for cmd, word in _LATEX_COMMANDS.items():
        expr = re.sub(re.escape(cmd), word, expr)

    # \frac{num}{den} → "num over den"
    def replace_frac(m: re.Match) -> str:
        num = _latex_inner(m.group(1))
        den = _latex_inner(m.group(2))
        return f" {num} over {den} "
    expr = _replace_braced(r"\\frac", expr, replace_frac, num_groups=2)

    # x^{exp} or x^n → "x to the power exp"
    def replace_sup(m: re.Match) -> str:
        base = m.group(1).strip() or ""
        exp  = _latex_inner(m.group(2))
        if base:
            return f" {base} to the power {exp} "
        return f" to the power {exp} "
    # superscript with braces
    expr = re.sub(r"(\w*)\^\{([^}]*)\}", replace_sup, expr)
    # superscript without braces
    expr = re.sub(r"(\w*)\^(-?\w+)", lambda m: f" {m.group(1)} to the power {m.group(2)} " if m.group(1) else f" to the power {m.group(2)} ", expr)

    # x_{sub} → "x sub sub"
    expr = re.sub(r"(\w*)_\{([^}]*)\}", lambda m: f" {m.group(1)} sub {_latex_inner(m.group(2))} " if m.group(1) else f" sub {_latex_inner(m.group(2))} ", expr)
    expr = re.sub(r"(\w*)_(-?\w+)",     lambda m: f" {m.group(1)} sub {m.group(2)} "              if m.group(1) else f" sub {m.group(2)} ", expr)

    # Strip remaining backslash commands like \left \right \! etc.
    expr = re.sub(r"\\[a-zA-Z!,;.]+\b\*?", " ", expr)

    # Strip remaining braces
    expr = expr.replace("{", " ").replace("}", " ")

    # Collapse whitespace
    expr = re.sub(r"\s{2,}", " ", expr).strip()
    return expr


def _replace_braced(command_pat: str, text: str,
                    replacer,
                    num_groups: int = 1) -> str:
    """
    Replace LaTeX commands with brace-delimited arguments.
    Handles nested braces correctly.
    """
    while True:
        # Find the command
        m = re.search(command_pat + r"\s*\{", text)
        if not m:
            break
        start = m.start()
        args = []
        pos = m.end() - 1          # position of opening '{'
        for _ in range(num_groups):
            if pos >= len(text) or text[pos] != "{":
                break
            # Walk to matching close brace
            depth = 0
            i = pos
            while i < len(text):
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                    if depth == 0:
                        args.append(text[pos + 1:i])
                        pos = i + 1
                        # skip optional whitespace between args
                        while pos < len(text) and text[pos] in (" ", "\t", "\n"):
                            pos += 1
                        break
                i += 1
            else:
                break

        if len(args) < num_groups:
            # Couldn't parse — just strip the command name
            text = text[:start] + text[m.end():]
            continue

        class FakeMatch:
            def group(self, n):
                return args[n - 1] if n <= len(args) else ""

        replacement = replacer(FakeMatch())
        text = text[:start] + replacement + text[pos:]

    return text


def _extract_latex(text: str) -> str:
    r"""
    Find all \(...\) and \[...\] and $...$ LaTeX blocks,
    convert each to spoken form, return text with blocks replaced.
    """
    # \( ... \)
    text = re.sub(
        r"\\\((.+?)\\\)",
        lambda m: " " + _latex_inner(m.group(1)) + " ",
        text, flags=re.DOTALL
    )
    # \[ ... \]
    text = re.sub(
        r"\\\[(.+?)\\\]",
        lambda m: " " + _latex_inner(m.group(1)) + " ",
        text, flags=re.DOTALL
    )
    # $$ ... $$
    text = re.sub(
        r"\$\$(.+?)\$\$",
        lambda m: " " + _latex_inner(m.group(1)) + " ",
        text, flags=re.DOTALL
    )
    # Standalone \( or \) that weren't caught (malformed)
    text = text.replace(r"\(", " ").replace(r"\)", " ")
    return text


# ── Stage 3: Semantic HTML tag handler ────────────────────────────────────────

class _TagStripper(HTMLParser):
    """
    Walks the HTML tree and converts tags to appropriate text fragments:
      <br> / <br/>  → ". "
      <p>  close     → ". "
      <li>           → ". "
      <a href=...>   → keep inner text, drop URL
      <ins>          → keep inner text (underlined word)
      all others     → keep inner text, drop tags
    """

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        tag = tag.lower()
        if tag in ("br",):
            self._parts.append(". ")
        elif tag in ("p", "div", "li", "tr", "td", "th"):
            self._parts.append(" ")
        # All other opening tags: nothing added, inner text flows through

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        if tag in ("p", "div", "li", "tr", "td", "th"):
            self._parts.append(". ")

    def handle_data(self, data: str):
        self._parts.append(data)

    def handle_entityref(self, name: str):
        # Named entities not caught by convert_charrefs
        try:
            char = html.unescape(f"&{name};")
            self._parts.append(char)
        except Exception:
            pass

    def handle_charref(self, name: str):
        try:
            char = html.unescape(f"&#{name};")
            self._parts.append(char)
        except Exception:
            pass

    def get_text(self) -> str:
        return "".join(self._parts)


def _strip_html_tags(raw: str) -> str:
    """Use HTMLParser to strip tags while preserving semantic whitespace."""
    stripper = _TagStripper()
    try:
        stripper.feed(raw)
        return stripper.get_text()
    except Exception:
        # Fallback: crude regex strip
        return re.sub(r"<[^>]+>", " ", raw)


# ── Stage 4: Unicode symbol → spoken word ─────────────────────────────────────

_UNICODE_SYMBOLS = [
    # Math
    ("⇒", " therefore "),   ("⇐", " follows from "),
    ("→", " implies "),      ("←", " is implied by "),
    ("⟹", " therefore "),   ("↔", " if and only if "),
    ("∝", " is proportional to "),
    ("∞", " infinity "),     ("√", " square root of "),
    ("∑", " sum "),          ("∏", " product "),
    ("∫", " integral "),     ("∂", " partial "),
    ("≥", " greater than or equal to "),
    ("≤", " less than or equal to "),
    ("≠", " not equal to "),
    ("≈", " approximately equal to "),
    ("×", " times "),        ("÷", " divided by "),
    ("±", " plus or minus "), ("∓", " minus or plus "),
    ("∩", " intersection "), ("∪", " union "),
    ("∈", " in "),           ("∉", " not in "),
    ("⊂", " subset of "),   ("⊃", " superset of "),
    # Typography
    ("°", " degrees "),
    ("′", " prime "),        ("″", " double prime "),
    ("½", " one half "),     ("¼", " one quarter "),
    ("¾", " three quarters "),
    ("²", " squared "),      ("³", " cubed "),
    ("¹", " to the power one "),
    ("—", ", "),             ("–", " to "),
    ("\u00a0", " "),         # non-breaking space
    # Currency
    ("₦", "Naira "),
    # Arrows used in chemistry
    ("⟶", " gives "),       ("⟵", " from "),
]

# IPA Unicode blocks — strip entirely (not readable by TTS)
_IPA_RANGES = [
    (0x0250, 0x02AF),  # IPA Extensions
    (0x02B0, 0x02FF),  # Spacing Modifier Letters (most are IPA)
    (0x1D00, 0x1DBF),  # Phonetic Extensions
    (0x1DC0, 0x1DFF),  # Combining Diacritical Marks Supplement
]


def _is_ipa(ch: str) -> bool:
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in _IPA_RANGES)


def _convert_unicode_symbols(text: str) -> str:
    for sym, spoken in _UNICODE_SYMBOLS:
        text = text.replace(sym, spoken)
    # Strip IPA characters
    text = "".join(" " if _is_ipa(c) else c for c in text)
    return text


# ── Stage 5: Currency normalisation ───────────────────────────────────────────

def _normalise_currency(text: str) -> str:
    """
    N20,000  →  20,000 Naira
    N10,500  →  10,500 Naira
    #230,000.00  →  230,000 Naira   (# used for Naira in some maths questions)
    # 230,000.00  →  230,000 Naira  (with space)
    """
    # N prefix (must not match things like "NB" or "Note")
    text = re.sub(
        r"\bN(\d[\d,]*(?:\.\d+)?)",
        lambda m: m.group(1).replace(",", ",") + " Naira",
        text
    )
    # # prefix used for Naira in some maths files
    text = re.sub(
        r"#\s*(\d[\d,]*(?:\.\d+)?)",
        lambda m: m.group(1).replace(",", ",") + " Naira",
        text
    )
    return text


# ── Stage 6: Abbreviation expansion ───────────────────────────────────────────

# Order matters — longer patterns first to avoid partial replacement
_ABBREVIATIONS = [
    # Academic / general
    (r"\bi\.e\.",       "that is"),
    (r"\be\.g\.",       "for example"),
    (r"\bviz\.",        "namely"),
    (r"\bvs\.",         "versus"),
    (r"\betc\.",        "and so on"),
    (r"\bNB\b",         "Note"),
    (r"\bn\.b\.",       "Note"),
    (r"\bp\.a\.",       "per annum"),
    (r"\bper annum\b",  "per annum"),   # keep as-is, TTS handles it
    # Math / science units
    (r"\bcm\b",         "centimetres"),
    (r"\bkm\b",         "kilometres"),
    (r"\bmm\b",         "millimetres"),
    (r"\bm\b(?=\s)",    "metres"),
    (r"\bkg\b",         "kilograms"),
    (r"\bg\b(?=\s)",    "grams"),
    (r"\bmg\b",         "milligrams"),
    (r"\bkJ\b",         "kilojoules"),
    (r"\bJ\b(?=\s)",    "joules"),
    (r"\bkPa\b",        "kilopascals"),
    (r"\bPa\b(?=\s)",   "pascals"),
    (r"\bml\b",         "millilitres"),
    (r"\bL\b(?=\s)",    "litres"),
    (r"\bmol\b",        "moles"),
    (r"\bM\b(?=\s)",    "molar"),
    # Chemistry
    (r"\bH2O\b",        "water"),
    (r"\bCO2\b",        "carbon dioxide"),
    (r"\bHCl\b",        "hydrochloric acid"),
    (r"\bNaCl\b",       "sodium chloride"),
    (r"\bH2SO4\b",      "sulfuric acid"),
    (r"\bHNO3\b",       "nitric acid"),
    (r"\bNH3\b",        "ammonia"),
]


def _expand_abbreviations(text: str) -> str:
    for pattern, replacement in _ABBREVIATIONS:
        text = re.sub(pattern, replacement, text)
    return text


# ── Stage 7 & 8: Whitespace + sentence termination ────────────────────────────

def _normalise_whitespace(text: str) -> str:
    text = text.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")
    text = text.replace("\t", " ")
    text = re.sub(r"\s{2,}", " ", text)
    # Remove stray dots caused by multiple ". . ." sequences
    text = re.sub(r"(\.\s*){3,}", ". ", text)
    # Remove space before punctuation
    text = re.sub(r"\s([.,;:!?])", r"\1", text)
    return text.strip()


def _ensure_sentence_end(text: str) -> str:
    if text and text[-1] not in ".?!":
        text += "."
    return text


# ── Public API ─────────────────────────────────────────────────────────────────

def clean_for_tts(raw: str | None) -> str:
    """
    Full 8-stage pipeline:
      1. LaTeX math  → spoken form
      2. HTML entity decode
      3. Semantic HTML tag strip
      4. Unicode symbol → spoken word / IPA strip
      5. Currency normalise
      6. Abbreviation expand
      7. Whitespace normalise
      8. Sentence termination

    Returns a clean plain-text string ready for Fish Audio TTS.
    Returns "" for None / empty / whitespace-only input.
    """
    if not raw or not raw.strip():
        return ""

    # Stage 1 — LaTeX (must run BEFORE entity decoding so \( stays intact)
    text = _extract_latex(raw)

    # Stage 2 — HTML entity decode  (&quot; &#39; &amp; &rArr; &ordm; etc.)
    text = html.unescape(text)

    # Stage 3 — Semantic HTML tags
    text = _strip_html_tags(text)

    # Stage 4 — Unicode symbols + IPA strip
    text = _convert_unicode_symbols(text)

    # Stage 5 — Currency
    text = _normalise_currency(text)

    # Stage 6 — Abbreviations
    text = _expand_abbreviations(text)

    # Stage 7 — Whitespace
    text = _normalise_whitespace(text)

    # Stage 8 — Sentence end
    text = _ensure_sentence_end(text)

    return text


def build_options_speech(options: list[dict]) -> str:
    """
    Build a single spoken string for all options with letter prefixes.

    Input:
        [{"tag": "a", "text": "N30,000", "is_correct": False}, ...]

    Output:
        "Option A. 30,000 Naira. Option B. 25,000 Naira. Option C. ..."

    Each option text goes through the full clean_for_tts pipeline.
    """
    parts: list[str] = []
    for opt in options:
        if not isinstance(opt, dict):
            # Some JSON files store options as plain strings — skip gracefully
            continue
        tag  = opt.get("tag", "").upper()
        raw  = opt.get("text", "") or ""
        text = clean_for_tts(raw)
        if not text:
            continue
        # Remove trailing period before appending so we get "Option A. text."
        text = text.rstrip(".")
        parts.append(f"Option {tag}. {text}.")
    return "  ".join(parts)


def build_reference_speech(passage: str | None) -> str:
    """
    Clean a reference_passage (SAT-style) for TTS.
    Highlighted markers <b>...</b> are prefixed with "quote" so
    the student knows the highlighted portion.
    """
    if not passage or not passage.strip():
        return ""
    # Wrap <b> content in "quote ... end quote"
    passage = re.sub(r"<b>(.*?)</b>", r" quote \1 end quote ", passage, flags=re.DOTALL)
    passage = re.sub(r"<i>(.*?)</i>", r"\1",  passage, flags=re.DOTALL)
    passage = re.sub(r"<u>(.*?)</u>", r"\1",  passage, flags=re.DOTALL)
    return clean_for_tts(passage)


# ── CLI preview ───────────────────────────────────────────────────────────────

def _preview(json_path: Path) -> None:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    sep  = "─" * 72

    for i, (qid, q) in enumerate(data.items()):
        qt   = q.get("question_text", "") or ""
        exp  = q.get("explanation", "")   or ""
        opts = q.get("options", [])
        ref  = q.get("reference_passage") or ""
        novel = q.get("novel") or ""

        print(f"\n{sep}")
        print(f"Q{q.get('order_id','?')} | ID={qid}")
        print(f"  RAW  : {qt[:120]!r}")
        print(f"  CLEAN: {clean_for_tts(qt)}")
        if opts:
            print(f"  OPTS : {build_options_speech(opts)}")
        if exp.strip():
            print(f"  EXP  : {clean_for_tts(exp)[:200]}")
        if ref.strip():
            print(f"  REF  : {build_reference_speech(ref)[:200]}")
        if novel.strip():
            print(f"  NOVEL: {novel}")

    print(f"\n{sep}")
    print(f"Total questions: {len(data)}")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else (
        Path(__file__).parent.parent.parent
        / "new_staging_area/ng/exams/university_entrance"
        / "jamb/accounts__principles_of_accounts/objective/1994.json"
    )
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)
    _preview(path)
