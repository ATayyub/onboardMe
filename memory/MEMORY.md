# Memory Index

This file is the index for all agent memory sub-files.
Load relevant sub-files at the start of each session.

## Sub-files

| File | Type | Contents |
|------|------|----------|
| memory/user.md | user | Developer profile, preferences, working style |
| memory/project.md | project | MVP goals, POC checklist, scope boundaries |
| memory/feedback.md | feedback | Established patterns, things that worked, things that did not |
| memory/reference.md | reference | External docs URLs, API references, useful commands |
| memory/blockers.md | project | Known blockers: network connectivity to Supabase from local machine |

## Load Order (recommended)
1. memory/project.md — always load first to anchor scope
2. memory/user.md — load to align on communication style
3. memory/feedback.md — load before writing any code
4. memory/reference.md — load when referencing external services
