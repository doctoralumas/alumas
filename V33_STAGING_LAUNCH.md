# Alumas v33 — Staging Launch Package

V33, v32 deployment artifact’ini gerçek staging yayınına hazırlayan operasyon katmanıdır.

Eklenenler:
- DNS A/AAAA preflight
- Caddy TLS/reverse proxy şablonu
- HTTPS staging smoke suite
- uptime monitor manifesti
- cron deploy manifesti ve güvenli runner
- tek komut `staging:launch`
- staging launch runbook

V33 staging launch komutu production channel/domain algılarsa durur ve image digest zorunlu tutar.
