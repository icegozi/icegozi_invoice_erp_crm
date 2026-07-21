# Operations runbook

## Backups and restore

Schedule `MONGO_CONTAINER=invoice-mongo ./ops/backup-mongodb.sh /absolute/secure/backup/path` daily from a host cron job. Store backups off-host and periodically test restoration in a non-production environment:

```bash
gzip -dc invoice-YYYYMMDDTHHMMSSZ.archive.gz | docker exec -i invoice-mongo mongorestore --archive --drop
```

## Production deployment

- Set a unique `JWT_SECRET`, `CORS_ORIGINS`, real `FRONTEND_URL`, and verified SMTP credentials.
- Do not publish port 27017. Put frontend/API behind TLS termination and monitor `/health`.
- Run the CI workflow before deployment. MongoDB is configured as a single-node replica set so financial writes use transactions.
- Provision a separate staging stack with its own database, secrets, SMTP sandbox, and URLs.

## Migrating to multiple organizations

The schema now accepts `organizationId` and includes tenant-aware indexes, while existing records remain compatible without one. Before enabling more than one organization, create an organization for every existing account, backfill `organizationId` on its Admin, clients, documents, payments, settings, taxes and payment modes, then deploy request-level tenant scoping. Do not mix records with and without an organization in a shared production workspace.
