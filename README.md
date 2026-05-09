# Notification System (Frontend)

This project is a small notifications dashboard built with **React + Vite**.  
It fetches notifications from an API, supports filtering/search, and can optionally send logs to a remote logging endpoint.

## Run locally

1) Install dependencies

```bash
cd notification_app_fe
npm install
```

2) Configure environment

- Copy `notification_app_fe/.env.example` to `notification_app_fe/.env.local`
- Fill in values (token optional)

3) Start dev server

```bash
npm run dev
```

## Configuration

- `VITE_API_BASE_URL`: API base URL (example: `http://4.224.186.213/evaluation-service`)
- `VITE_API_TOKEN`: bearer token used for notifications API auth
- `VITE_LOG_ENDPOINT`: log ingestion endpoint
- `VITE_LOG_TOKEN`: bearer token for logging (leave empty if not required)

