# ADR 002 — independent loopback services

Accepted 2026-10-20.

Public and operator views are different Node entry points, HTTP listeners,
route tables and frontend content. There is no conditional `isAdmin` switch on
the public service. Public assets are the compiled React game only.

Public is read-only and serves curated DEMO data. Operator binds 127.0.0.1 only,
requires an independent local password and rejects cross-origin browser traffic,
unexpected Hosts and proxy headers. Nothing connects to GitHub or agents yet.

Rationale: isolation can be tested before collecting any private data. The later
Cloudflare tunnel must route only to port 3000; adding an operator hostname is
outside this decision. A compromised OS account is outside this localhost trust
model, and loopback Basic auth is unsuitable for remote operation.

Verification: Node injection tests, real production-server browser route probes,
bundle scan, and an actual authenticated loopback smoke test.
