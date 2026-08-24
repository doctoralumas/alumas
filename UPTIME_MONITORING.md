# Uptime Monitoring

`deploy/monitoring/uptime-monitors.json` harici uptime sağlayıcısına aktarılabilecek nötr bir manifesttir. En az readiness ve health endpointleri 60 saniyede bir izlenmelidir.

Önerilen alarm:
- 2 ardışık readiness hatası: uyarı
- 5 dakika kesinti: SEV-2
- production login/randevu akışını etkileyen kesinti: SEV-1 değerlendirmesi

`/api/ops/metrics` public monitor olarak kullanılmamalı; `METRICS_SECRET` ile korunmalıdır.
