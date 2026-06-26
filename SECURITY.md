# Security Policy

## Reporting a vulnerability

Please report security issues **privately** to **info@uppy.ai** (or via GitHub's
"Report a vulnerability" advisory flow). Do not open public issues for vulnerabilities.

We aim to acknowledge reports within 3 business days and to ship a fix or mitigation
plan within 14 days for confirmed issues.

## Handling of API keys

pagelathe is a local-first tool. Your OpenRouter API key is stored only on your machine
(in `~/.pagelathe/config.json`, mode `0600`, or via the `OPENROUTER_API_KEY` env var) and
is sent **only** to OpenRouter. It is never transmitted to any pagelathe-operated service,
logged, or committed. Reports of any deviation from this are treated as security issues.

## Supported versions

The latest published minor version receives security fixes.
