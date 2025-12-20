## Success Measurement

We use a query that is vague against a local knowledge base that has partial hits and some direct hits. Ideal we want to see the direct hits ranked highest and partial lower with proper scoring as relevancy degrades.

NOTE: We have to re-index the RAG store to ensure the embedding for store and query match

### Query

*guidance on my professional development plan*

## Xenova/all-MiniLM-L6-v2 (base line current)

### Results:

```
SCORE:  0.85  SOURCE:  personal/my-career/hub.md
SCORE:  0.80  SOURCE:  x-archive/achievement-discoveries/hub.md
SCORE:  0.76  SOURCE:  general/feedback/end-of-cycle-review-2025-08-28.md
SCORE:  0.49  SOURCE:  x-archive/achievement-discoveries/Initial Chat.md
SCORE:  0.49  SOURCE:  _context-vault/x-archive/17-11-2025 Monday (cooldown).md
```

## intfloat/e5-small

### Results:

```
SCORE:  1.00  SOURCE:  personal/my-career/hub.md
SCORE:  1.00  SOURCE:  general/feedback/nes758-process-improvement-feedback.md
SCORE:  1.00  SOURCE:  work/_work_report/07.13-17-oct (cycle).md
SCORE:  1.00  SOURCE:  x-archive/achievement-discoveries/tasks.md
SCORE:  0.85  SOURCE:  achievement-discoveries/decisions/README.md
```

## intfloat/e5-base-v2

### Results:

```
SCORE:  1.00  SOURCE:  specs/Cycle 05/System Prompt Sturcture.md
SCORE:  0.88  SOURCE:  _context-vault/content-guides/Project-Hub.md
SCORE:  0.79  SOURCE:  _context-vault/x-archive/17-11-2025 Monday (cooldown).md
SCORE:  0.78  SOURCE:  _context-vault/content-guides/ADR.md
SCORE:  0.77  SOURCE:  _context-vault/content-guides/Quick-Note.md
```

## BAAI/bge-base-en-v1.5

### Results:

```
SCORE:  0.94  SOURCE:  specs/Cycle 05/System Prompt Sturcture.md
SCORE:  0.73  SOURCE:  x-archive/achievement-discoveries/Initial Chat.md
SCORE:  0.67  SOURCE:  _context-vault/x-archive/17-11-2025 Monday (cooldown).md
SCORE:  0.64  SOURCE:  general/tasks/chat-with-phil.md
SCORE:  0.63  SOURCE:  Code/_context-vault/_priorities.md
```

