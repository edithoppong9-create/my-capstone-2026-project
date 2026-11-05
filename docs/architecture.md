
# Event Ticketing and Booking — Architecture

## 1. Layer architecture

```mermaid
flowchart TD
    Routes[Routes / HTTP] --> Services[Services]
    Services --> Rules[Domain Rules]
    Services --> Repositories[Repositories / Data Access]
    Repositories --> Database[(Database)]
```

- **Routes:** May handle HTTP requests, parameters, and responses. Must not contain business rules or access the database directly.

- **Services:** May coordinate operations and apply business workflows. Must not handle HTTP details or bypass the domain rules.

- **Domain rules:** May validate business rules and calculate outcomes. Must not depend on HTTP, services, or database implementation details.

- **Repositories:** May read and write stored data. Must not make HTTP responses or decide business workflows.

Dependencies flow downward; higher layers must not be called by lower layers.

## 2. Data model

```mermaid
erDiagram
    USER ||--o{ BOOKING : makes
    EVENT ||--o{ TICKET_TIER : offers
    EVENT ||--o{ BOOKING : receives
    TICKET_TIER ||--o{ BOOKING : selected_for

    USER {
        string id
        string name
        string email
    }

    EVENT {
        string id
        string title
        string city
        string venue
        string date
    }

    TICKET_TIER {
        string id
        string event_id
        string name
        integer price_cents
        integer capacity
        integer sold
    }

    BOOKING {
        string id
        string user_id
        string event_id
        string ticket_tier_id
        integer quantity
        integer total_cents
        string state
    }
```

This diagram describes the proposed relationships between users, events, ticket tiers, and bookings. It does not mean that user management or database persistence has already been implemented.

## 3. Booking life cycle

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> paid
    pending --> cancelled
    paid --> checked_in
    paid --> refunded
    paid --> cancelled
    cancelled --> [*]
    refunded --> [*]
    checked_in --> [*]
```

Allowed transitions:

- `pending` → `paid`
- `pending` → `cancelled`
- `paid` → `checked_in`
- `paid` → `refunded`
- `paid` → `cancelled`

The final states are `cancelled`, `refunded`, and `checked_in`. No transitions are allowed out of these states.
