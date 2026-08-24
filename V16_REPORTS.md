# Alumas v16 - Reports & Doctor Sharing

- Health report date range filtering supports week, month, or custom dates (max 366 days).
- `/api/health/reports/pdf` generates a real PDF server-side with `pdf-lib`.
- Patients can share a bounded health-report date window with a doctor they have an appointment relationship with.
- Doctors can inspect blood-pressure, glucose, and sleep trends only when an active measurement consent or active report share exists.
- Medication history calendar shows only explicitly logged TAKEN/SKIPPED doses; missing entries are not interpreted as skipped.
- Blood pressure, glucose, and sleep APIs accept `from` / `to` filters.
