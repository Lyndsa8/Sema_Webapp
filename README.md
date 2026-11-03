# SEMA: Complaint Intelligence

SEMA brings customer complaints from many channels into one place, links related complaints, and helps the right team fix the cause faster. It was built by **Team Sauti** for a hackathon on 29 October 2026 and is **still under development**.

## The problem

Customers complain in different languages and through many channels (social media, apps, USSD, customer care). The same fault is often logged many times in separate places, so teams see scattered tickets and not one problem.

## What SEMA does

- **One view of complaints.** Gathers complaints from LinkedIn, X, Zuri, One App and USSD. The current version uses sample data for the channel feeds.
- **Links related complaints.** Groups tickets by location (GPS) and by customer, so an area-wide fault shows up as one problem.
- **Suggests a likely cause.** For example, M-PESA failure vs a fibre issue in the same area, and sends it to the right team inside the ticket.
- **Self-help first.** When an issue is solvable, the customer gets steps to fix it instead of a ticket.
- **Keeps customers informed.** Notifies them when their issue is in progress and when it is solved.
- **Image uploads.** Customers can attach screenshots (for example, One App stuck loading while data is on).
- **Admin console.** Left-hand sidebar with separate pages for alerts, tickets and maps; alerts cover both officers and customers.
- **Maps.** Real GPS maps with place names.

## Why it matters

Better management of customer complaints: identifying recurring issues and clustering issues from the same location, so an area-wide fault is handled as one problem and routed to the right team.

## Tech

Built with TypeScript and Vite, with a small Node server (`server.ts`), generated from the Google AI Studio template.

## Project structure

```
docs/            Project documentation
public/          Static assets
scripts/         Helper scripts
src/             Application source
server.ts        Server entry
index.html       App entry
vite.config.ts   Vite config
.env.example     Example environment variables
```

## Run it locally

Requires Node.js 18 or later.

```bash
git clone https://github.com/Lyndsa8/Sema_Webapp.git
cd Sema_Webapp
npm install
cp .env.example .env.local     # then add your own keys (see .env.example)
npm run dev
```

Open the address shown in the terminal. Do not commit `.env.local` or any API keys.

## Status

Prototype, still under development. Planned next: real channel integrations, linking by area and person with stronger cause suggestions, and customer ticket tracking.

## Team

Team Sauti. Safaricom internship hackathon, October 2026.
