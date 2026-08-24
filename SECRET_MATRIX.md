# Secret Matrix

| Secret | Staging | Production | Repo'ya girer mi? |
|---|---|---|---|
| DATABASE_URL | gerekli | gerekli | hayır |
| SECURITY_HASH_SALT | gerekli | gerekli | hayır |
| AUDIT_HASH_SALT | gerekli | gerekli | hayır |
| POSTGRES_PASSWORD | gerekli | gerekli | hayır |
| METRICS_SECRET | önerilir | gerekli | hayır |
| MAINTENANCE_BYPASS_SECRET | önerilir | gerekli | hayır |
| TWILIO_AUTH_TOKEN | Twilio ise | Twilio ise | hayır |
| FIREBASE_PRIVATE_KEY | push ise | push ise | hayır |
| S3_SECRET_ACCESS_KEY | S3/R2 ise | S3/R2 ise | hayır |
| DAILY_API_KEY | video ise | video ise | hayır |

Secrets deployment platform secret manager üzerinden enjekte edilmelidir.
