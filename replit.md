# Holocron - Defense & Surveillance Command Platform

## Overview
Holocron is a defense-focused enterprise command platform with five primitives: Connectors, Ontology, Orchestration, Probes, and Use-Case Factory. Primary focus on defense, surveillance, and command & control operations with additional sector use-cases: ITSM, Cyber Compliance, and FIU/FATF.

## Branding
- Logo: Holocron hexagonal logo (attached_assets/Holocron_Logo_Icon_White_1771788703008.png)
- Theme: Dark, military-style defense aesthetic
- Login page: Defense/surveillance themed with classification banner

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + wouter routing + Leaflet (react-leaflet) for GIS
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Auth**: Session-based with RBAC (admin, operator, analyst, supervisor, auditor, executive_viewer)

## Project Structure
- `client/src/pages/` - All page components (dashboard, defense-map, command-control, ontology, missions, workflows, probes, usecases, kpis, admin, login, notifications)
- `client/src/components/` - Shared components (app-sidebar, page-header, stat-card, status-badge)
- `server/` - Express routes, storage layer, db connection, seed data
- `shared/schema.ts` - Drizzle ORM schema with all tables

## Key Features
- **RBAC**: 6 roles with route protection and workflow transition checks
- **Defense GIS**: Leaflet-based map with military asset markers, threat positions, operational zones, intel overlays (Palantir-style)
- **Workflow Engine**: JSON-defined state machines with RBAC-checked transitions
- **Probes**: 11 probe types including drone link monitor, airspace deconfliction, sensor health, endpoint control, fuel/endurance monitoring
- **KPI Engine**: Computes metrics across platform, ITSM, Cyber, FIU, Defense sectors
- **Evidence Pack Export**: JSON export of mission data
- **Audit Logging**: Every action creates an audit record
- **Command Control Center (C2)**: Threat management, endpoint directives, quick tactical actions, telemetry feed, response order tracking, AI Advisor
- **AI Tactical Advisor**: OpenAI-powered tactical recommendation engine with human-in-the-loop approval workflow (pending → approved → executed / rejected). Analyzes assets, threats, intel, and mission status.
- **Ontology Explorer**: Entity types, properties, relationships (includes military unit, theater, platform, threat, installation types)

## Defense Sector
- Schema tables: geo_assets, geo_zones, intel_reports, directives, threat_responses, ai_recommendations
- API routes: /api/defense/map, /api/defense/geo-assets, /api/defense/geo-zones, /api/defense/intel-reports, /api/defense/geo-assets/:id/status
- C2 API routes: /api/c2/overview, /api/c2/directives, /api/c2/threat-responses, /api/c2/quick-action
- AI API routes: /api/ai/recommendations (GET), /api/ai/recommendations/generate (POST), /api/ai/recommendations/:id/approve|reject|execute (PATCH)
- Mission templates: Force Deployment & Operations, ISR Collection Mission, Threat Assessment & Response
- Active mission: Operation Sentinel Shield (Eastern Mediterranean Theater)
- GIS features: Dark CARTO tiles, layer toggles, asset/intel sidepanels, zone polygons, detail cards
- 50+ geo assets: drones (RQ-4, MQ-9, MQ-1C, RQ-7, ScanEagle, MQ-25, Switchblade 600), aircraft (F-35A, E-3G AWACS, P-8A, KC-135, RC-135V, C-17, B-2A, AH-64E), naval (DDG-119, CG-73, CVN-78 carrier, SSN-790 submarine, FFG-62 frigate), missile defense (Patriot PAC-3, THAAD, Iron Dome), strike (HIMARS, Tomahawk, M109A7 Paladin), ground (armor, infantry, SOF), installations (air base, naval base, command post, SATCOM relay), intelligence (EW, Cyber, MUOS satellite ground), threats (S-400 SAM, ballistic TEL, hostile corvettes, hostile submarine, hostile drones/UCAVs)
- Map categories: ground_force, naval, air, missile_defense, strike, intelligence, installation, logistics, medical, threat
- Asset type markers use text symbols (HQ, DD, GH, GE, AW, etc.) - no emojis

## Demo Accounts
- admin / demo123 (Sarah Chen - Admin)
- operator / demo123 (James Wilson - Operator)
- analyst / demo123 (Maria Garcia - Analyst)
- supervisor / demo123 (Robert Kim - Supervisor)
- auditor / demo123 (Elena Petrov - Auditor)
- executive / demo123 (David Thompson - Executive Viewer)

## Running
`npm run dev` starts the Express backend + Vite frontend on port 5000.
