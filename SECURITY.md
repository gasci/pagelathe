# Security Policy

## Reporting a vulnerability

Please report security issues **privately** to **drgoktugasci@gmail.com** (or via GitHub's
"Report a vulnerability" advisory flow). Do not open public issues for vulnerabilities.

We aim to acknowledge reports within 3 business days and to ship a fix or mitigation
plan within 14 days for confirmed issues.

## Handling of API keys

pagelathe is a local-first tool. Your provider API keys (OpenRouter, Gemini, and/or OpenAI)
are stored only on your machine — in `~/.pagelathe/config.json` (mode `0600`) or via the
matching env var (`OPENROUTER_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, or `OPENAI_API_KEY`) —
and each key is sent **only** to that provider's official API (OpenRouter, Google Generative
Language, or OpenAI). Keys are never transmitted to any pagelathe-operated service, logged, or
committed. Reports of any deviation from this are treated as security issues.

## Supported versions

The latest published minor version receives security fixes.
