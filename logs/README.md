# Logs directory

This folder is used by the server to write runtime logs locally. The project logger writes to:

- logs/combined.log — combined logs (info/debug)
- logs/error.log — errors only
- logs/notifications.log — notification payloads (userId, event id/timestamps)
- logs/emails.log — outgoing email payload summaries

## How to view logs

In a terminal (from repository root):

```bash
# follow notifications
tail -f logs/notifications.log

# follow emails
tail -f logs/emails.log
```

You can also open these files directly in VS Code to inspect content.

## Security note

These logs are meant for local development and debugging only. Avoid committing real user personal data to version control and do not expose these logs in production setups.
