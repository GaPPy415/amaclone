# CAPTURE-TEST

Capture is live and automatic. This document records the setup, the mechanism, the
raw canaries, and the dead ends hit on the way.

---

## 1. Setup

**Tool:** `opencode` (running the OhMyOpenCode / "Sisyphus" agent configuration).

- Binary: `C:\ProgramData\chocolatey\bin\opencode.exe`
- Version: **1.18.32** (`opencode --version`)
- Plugin SDK present: `@opencode-ai/plugin@1.18.30` at `~/.config/opencode/node_modules/`

**Models.** opencode runs one agent loop; OhMyOpenCode splits work across agents whose
models are pinned in `~/.config/opencode/oh-my-opencode.json`. The orchestrator/planner is
`sisyphus`; executors are the subagents (`explore`, `librarian`, `oracle`, `metis`, `momus`).

- Orchestrator/primary for this session (runtime banner): `opencode-go/deepseek-v4.1-flash`
- During this setup, the two research subagents ran on `opencode-go/minimax-m2.7`
- Canaries ran on `opencode-go/deepseek-v4.1-flash`, and one on `opencode-go/minimax-m3`
  specifically to confirm a **model switch is visible in the log** (see the `model:` lines)

**Does the tool have a hook / lifecycle-event / rules mechanism that can run automatically
on every prompt and every response?** — **Yes.** opencode's mechanism is **plugins**.

This was verified from three independent sources, not guessed:

1. `@opencode-ai/plugin@1.18.30` was already installed locally. Its `dist/index.d.ts`
   defines the full `Hooks` interface, including `chat.message` and the generic `event` hook.
2. The **1.18.32 binary embeds its own documentation**, which states verbatim:

   > Auto-discovered plugins (no config entry needed): any `*.ts` or `*.js` file in
   > `.opencode/plugin/` or `.opencode/plugins/`.
   >
   > A plugin module exports `default` (or any named export) of type
   > `Plugin = (input: PluginInput, options?) => Promise<Hooks>`.

3. `~/.config/opencode/opencode.json` already used the mechanism on this machine:
   `{ "plugin": ["oh-my-openagent@latest"] }` — so it was demonstrably loaded and working.

There is **no** `.claude/settings.json`-style hook file in opencode. The correct mechanism is a
plugin, and it fires on its own with nothing to remember to run.

---

## 2. Mechanism used, and the config file changed

**Config file changed: none.**

The plugin relies entirely on auto-discovery. It lives at:

```
.opencode/plugins/agent-capture.ts
```

I deliberately did **not** also list it in `opencode.json`'s `plugin` array. Adding it there
*as well* would register the same plugin twice and duplicate every log entry.

### How it captures

| Hook | Fires when | Writes |
|---|---|---|
| `chat.message` | a user message is created | `[LOG_ENTRY type=PROMPT ...]` |
| `event` → `session.idle` | the session goes idle = end of turn | `[LOG_ENTRY type=RESPONSE ...]` |

- **PROMPT** text is taken straight from the user message's `text` parts — verbatim, no
  truncation, no paraphrase, no cleanup.
- **RESPONSE** is read back after end-of-turn via `client.session.messages()` and selects the
  assistant message(s) whose `parentID` matches that prompt. Only `type: "text"` parts are
  kept, so **reasoning, tool calls, step-start/step-finish, patch and snapshot parts are dropped**.
- **Child sessions are skipped** (subagents via `task`, plus opencode's internal `title` and
  summarize sessions all carry `parentID`). Their traffic is intermediate working, not the
  prompt/final-response pair the brief asks for.
- One file per session, written to `YYYY-MM-DD_HH-MM-SS_<session-id>.md`, with the frontmatter
  rewritten each turn so `total_exchanges`, `first_prompt_time` and `last_prompt_time` stay current.

### Verification that capture is verbatim

Rather than trusting the plugin, I diffed its output against **opencode's own persisted
message store** (`~/.local/share/opencode/opencode.db`, table `part`, JSON `data` column) for
the same session. The plugin's `PROMPT` line is **byte-identical** to opencode's stored `TextPart`:

```
stored  codepoints: 67,65,80,84,85,82,69,32,84,69,83,84,32,8212,32,56,120,...,68,97,118,105,100
logged  codepoints: 67,65,80,84,85,82,69,32,84,69,83,84,32,8212,32,56,120,...,68,97,118,105,100
```

(`8212` = U+2014 EM DASH, preserved.)

### Verification that "nothing in between" is really filtered

One canary forced a tool call. opencode's store shows that turn contained:

```
assistant parts: {"step-start":1,"tool":1,"step-finish":1}          tools invoked: read
assistant parts: {"step-start":1,"reasoning":1,"text":1,"step-finish":1}
```

…while the captured log contains **only** the final text (`node_modules/`). Two step-starts,
one tool call, one reasoning part and two step-finishes were correctly excluded.

---

## 3. Where the canaries landed

```
.agent-logs/
```

Committed to the repo, not gitignored (see `.gitignore`). Line endings are pinned via
`.gitattributes` (`* -text`) so the captured bytes survive a fresh clone unchanged.

Canaries from this verification:

| File | Session | Notes |
|---|---|---|
| `2026-09-26_14-34-22_ses_f21dc8710ffeiBNWiuGjGO3HNC.md` | CLI, deepseek-v4.1-flash | canary #1 |
| `2026-09-26_14-34-39_ses_f21dc434dffeGbGr5EUXnp81ah.md` | CLI, minimax-m3 | canary #2, proves model switch is recorded |
| `2026-09-26_14-35-10_ses_f21dbc9edffeUwiiqQu5oWUMwQ.md` | CLI | argv-quoting artifact, see §5 |
| `2026-09-26_14-35-40_ses_f21db5632ffegz3fZFqJF3xtdw.md` | CLI | space-free control |
| `2026-09-26_14-36-46_ses_f21da5583ffeHWFB4w2FiQiqZE.md` | HTTP API | **canary A, clean** |
| `2026-09-26_14-37-24_ses_f21d9bec1ffeSY36UwBJkR4qVE.md` | HTTP API | **canary B, clean** |
| `2026-09-26_14-38-26_ses_f21d8cb6fffe80JrxeeUuYJDGs.md` | HTTP API | tool-call filtering proof |

Every file above was produced by a **separate session**, and the CLI ones by separate
*processes*, so the hook is proven not to depend on the session that created it.

---

## 4. Both canary entries, pasted raw

### Canary A — `.agent-logs/2026-09-26_14-36-46_ses_f21da5583ffeHWFB4w2FiQiqZE.md`

```markdown
---
session_id: ses_f21da5583ffeHWFB4w2FiQiqZE
date: 2026-09-26
author: GaPPy415
model: opencode-go/deepseek-v4.1-flash
tool: opencode
project: amaclone
total_exchanges: 1
first_prompt_time: 2026-09-26T14:36:46.092Z
last_prompt_time: 2026-09-26T14:36:53.801Z
---

# Session Log - 2026-09-26

Session: `ses_f21da5583ffeHWFB4w2FiQiqZE` | Project: `amaclone` | Author: `GaPPy415`

---
[LOG_ENTRY type=PROMPT num=1 session=ses_f21da5583ffeHWFB4w2FiQiqZE]
timestamp: 2026-09-26T14:36:46.092Z
model: opencode-go/deepseek-v4.1-flash

CAPTURE TEST — 8x assignment, David

[LOG_ENTRY type=RESPONSE num=1 session=ses_f21da5583ffeHWFB4w2FiQiqZE]
timestamp: 2026-09-26T14:36:53.801Z
model: opencode-go/deepseek-v4.1-flash

I don't have enough to act on. "CAPTURE TEST — 8x assignment, David" doesn't map to a task I can execute.

What are you asking for?
- A test of session capture/memory? (I can echo back context.)
- An "8x assignment" — multiply something by 8? Assign work to 8 agents? A specific file/feature named "8x"?
- "David" — is that you, a variable, or a target name?

Give me the concrete goal (file, command, or expected output) and I'll proceed.
```

### Canary B — `.agent-logs/2026-09-26_14-37-24_ses_f21d9bec1ffeSY36UwBJkR4qVE.md`

```markdown
---
session_id: ses_f21d9bec1ffeSY36UwBJkR4qVE
date: 2026-09-26
author: GaPPy415
model: opencode-go/deepseek-v4.1-flash
tool: opencode
project: amaclone
total_exchanges: 1
first_prompt_time: 2026-09-26T14:37:24.183Z
last_prompt_time: 2026-09-26T14:37:28.997Z
---

# Session Log - 2026-09-26

Session: `ses_f21d9bec1ffeSY36UwBJkR4qVE` | Project: `amaclone` | Author: `GaPPy415`

---
[LOG_ENTRY type=PROMPT num=1 session=ses_f21d9bec1ffeSY36UwBJkR4qVE]
timestamp: 2026-09-26T14:37:24.183Z
model: opencode-go/deepseek-v4.1-flash

CAPTURE TEST — 8x assignment, David

[LOG_ENTRY type=RESPONSE num=1 session=ses_f21d9bec1ffeSY36UwBJkR4qVE]
timestamp: 2026-09-26T14:37:28.997Z
model: opencode-go/deepseek-v4.1-flash

I don't have enough to act on. "CAPTURE TEST — 8x assignment" isn't a recognizable instruction or task, and there's no explicit action requested.

What do you want me to do?

- **Capture something** — screenshot/record/test output? From what (browser, app, file)?
- **Run a test** — which suite, and does "8x assignment" mean run it 8 times / test an assignment 8 times?
- **Something in this repo** (`amaclone`) — if so, name the file/module and the expected behavior.

Give me the actual goal (what to capture/test, where, and what "pass" looks like) and I'll proceed.
```

---

## 5. Anything tried first that did not work

**1. Assumed a Claude Code–style hook file.** My first instinct was a `.claude/settings.json`
equivalent wiring a prompt event and an end-of-turn event to a script. opencode has no such
thing. `grep`-ing the binary for the plugin section is what surfaced the real mechanism. Do not
reach for a settings file here — write a plugin.

**2. `opencode.json` double-registration nearly happened.** The obvious-looking move was to
add `"./.opencode/plugins/agent-capture.ts"` to the `plugin` array in config as well as relying
on auto-discovery. That registers it twice and would have written two of every entry. Auto-discovery
alone is correct.

**3. PowerShell `$PSNativeCommandArgumentPassing = 'Standard'` corrupted the prompt.** The default
`Windows` mode was suspected of adding the stray quotes seen in canaries #1–#4. Switching to
`Standard` did *not* remove the quotes and additionally **mangled the em dash to a hyphen**:

```
before: CAPTURE TEST — 8x assignment, David   (codepoint 8212 preserved)
after : CAPTURE TEST - 8x assignment, David   (em dash lost)
```

So that mode is strictly worse and was reverted.

**4. `opencode run "<prompt with spaces>"` injects literal double quotes into the message.**
Canaries #1–#4 were logged as `"CAPTURE TEST — 8x assignment, David"` *with quotes as part of the
text*. I initially suspected my plugin. It is not the plugin — I confirmed by comparing against
opencode's own store for the same session:

```
opencode stored TextPart : "\"CAPTURE TEST — 8x assignment, David\""   # quotes already present
plugin logged            : "\"CAPTURE TEST — 8x assignment, David\""   # identical
```

and with a space-free prompt the quotes vanish entirely (`CANARYNQTEST` → logged clean). The quote
is added by the `opencode run` CLI argument path, **upstream of the plugin**. Because the plugin
copies the stored part byte-for-byte, the fix was to stop testing through CLI argv: canaries A and B
were sent through opencode's HTTP API (`session.create` + `session.prompt`), which is the exact path
the interactive TUI uses. Those are clean.

Those first four CLI canary files were **left in `.agent-logs/` unedited** rather than deleted,
so the wrong turn is visible.

**5. Comments in the plugin tripped a repo hook.** The first draft carried explanatory comments
throughout. A hook in this environment rejects avoidable comments, so it was trimmed down to two
that document genuinely non-obvious facts (the verified hook contract, and why child sessions are
gated). Everything else was made self-documenting by naming.

---

## 6. One caveat worth stating plainly

opencode loads plugins **at startup**. This document was written inside an already-running session,
so that session is not itself being captured — the plugin was not yet loaded when it began. The
verification above therefore ran in fresh opencode processes (separate servers / separate `run`
invocations), which is the stronger test: it proves the hook works in sessions *other* than the one
that created it.

**Restart opencode in this directory and capture is live for every subsequent prompt**, with no
action required. From there the log interleaves with the code automatically.
