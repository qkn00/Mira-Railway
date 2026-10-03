# Mira — Railway deployment

## Required environment variable
`DATABASE_URL`

Railway PostgreSQL provides `DATABASE_URL` when the database service is linked to the Mira service.

## Start command
`npm start`

## Health check
`/api/health`

No API keys or secrets are stored in this repository. Add external API credentials later through Railway Variables or n8n Credentials.
