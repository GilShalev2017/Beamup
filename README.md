# Beamup Monorepo — Interview Skeleton

## Stack
- **Frontend**: React 19 + Vite + TypeScript | MUI + Tailwind + Lucide | TanStack Query + Zustand + React Router
- **Backend**: Express + TypeScript | MongoDB (Mongoose) + PostgreSQL (Prisma) + Redis + Elasticsearch + Kafka | Socket.IO | OpenAI
- **Infra**: Docker Compose (Postgres, MongoDB, Redis, Elasticsearch, Kafka + Kafka UI)
- **Monorepo**: Turborepo + npm workspaces

## Getting Started

### 1. Start all infrastructure
```bash
docker-compose up -d
```
Kafka UI available at http://localhost:8080

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in OPENAI_API_KEY if needed
```

### 4. Set up PostgreSQL schema
```bash
cd apps/api
npm run prisma:migrate    # creates tables
npm run prisma:generate   # generates client
```

### 5. Seed the database
```bash
npm run db:seed
```

### 6. Start everything
```bash
npm run dev   # starts both apps/api and apps/web in parallel
```

- API  → http://localhost:5000
- Web  → http://localhost:5173
- Health → http://localhost:5000/health
- Kafka UI → http://localhost:8080

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | List items (filter by category, status, warehouseId, search) |
| GET | /api/items/:id | Get item by ID (Redis cached) |
| POST | /api/items | Create item (validates via Zod, publishes Kafka event) |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| PATCH | /api/items/:id/quantity | Adjust stock quantity (triggers low-stock alert) |

## Architecture

```
Request → Route → Controller → Service → Repository → MongoDB
                                   ↓            ↓
                               Kafka emit    Redis cache
                                   ↓
                           Socket.IO broadcast → React UI
```

## Kafka Topics
| Topic | Purpose |
|-------|---------|
| `item.updates` | Every create/update/delete event |
| `supply-chain.alerts` | Low stock, anomalies |
| `agent.actions` | AI agent tool call results |
| `inventory.events` | Raw inventory changes |

## Socket.IO Events
**Server → Client**
- `item:created` — new item
- `item:updated` — item modified
- `item:deleted` — item removed
- `alert` — supply chain alert
- `inventory:update` — Kafka-forwarded update

**Client → Server**
- `join:inventory` — subscribe to inventory room
- `agent:run` — trigger AI agent task

## OpenAI Agent (agent.service.ts)
The agent uses GPT-4o with function calling (tool use). Available tools:
- `get_inventory_status` — check warehouse stock
- `trigger_restock` — create a restock order
- `flag_anomaly` — flag for human review

Wire it to a route by calling `runAgent({ userMessage: '...' })`.
