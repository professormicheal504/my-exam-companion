import re

with open('public/modules/rank/rank.html', 'r', encoding='utf-8') as f:
    content = f.read()

css_addition = """
    /* ===========================
       DARK MODE
    =========================== */
    :root[data-theme="dark"] body { background: var(--bg-base); }
    :root[data-theme="dark"] .content-area,
    :root[data-theme="dark"] .main-content {
      background: var(--bg-base);
    }
    :root[data-theme="dark"] .status-card,
    :root[data-theme="dark"] .node-content {
      background: var(--bg-card);
      border-color: var(--border);
    }
    :root[data-theme="dark"] .journey-title,
    :root[data-theme="dark"] .status-title,
    :root[data-theme="dark"] .level-name {
      color: var(--text-primary);
    }
    :root[data-theme="dark"] .status-desc,
    :root[data-theme="dark"] .level-desc {
      color: var(--text-muted);
    }
    :root[data-theme="dark"] .timeline::before,
    :root[data-theme="dark"] .progress-bar-container {
      background: #334155 !important;
    }
    :root[data-theme="dark"] .node-dot {
      background: var(--bg-card);
      border-color: #334155;
      color: var(--text-muted);
    }
    :root[data-theme="dark"] .level-node.completed .node-dot {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    :root[data-theme="dark"] .level-node.current .node-dot {
      background: var(--bg-card);
      border-color: #2563eb;
      color: #2563eb;
    }
    :root[data-theme="dark"] .level-node.final .node-content {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-card) 100%);
      border-color: #f59e0b;
    }
    :root[data-theme="dark"] .level-node.final .node-dot {
      background: rgba(245, 158, 11, 0.2);
    }
    :root[data-theme="dark"] .status-card > div[style*="color: #111827"] {
      color: var(--text-primary) !important;
    }
    :root[data-theme="dark"] .congrats-modal {
      background: var(--bg-card);
    }
    :root[data-theme="dark"] .congrats-title {
      color: var(--primary);
    }
    :root[data-theme="dark"] .congrats-desc {
      color: var(--text-muted);
    }
  </style>
"""

content = content.replace("  </style>\n</head>", css_addition + "</head>")

with open('public/modules/rank/rank.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
