export const mockEvents = [
  {
    id: 'event-1',
    title: 'Accra Tech Conference',
    city: 'Accra',
    venue: 'Accra International Conference Centre',
    startsAt: '2026-12-15T09:00:00Z',
    status: 'published',
    tiers: [
      {
        id: 'tier-1',
        eventId: 'event-1',
        name: 'General Admission',
        priceCents: 5000,
        capacity: 100,
        sold: 0,
        seatsLeft: 100,
      },
      {
        id: 'tier-2',
        eventId: 'event-1',
        name: 'VIP',
        priceCents: 15000,
        capacity: 50,
        sold: 50,
        seatsLeft: 0,
      },
    ],
  },
    {
    id: 'event-2',
    title: 'Ghana Digital Innovation Summit',
    city: 'Kumasi',
    venue: 'Kumasi City Mall Conference Centre',
    startsAt: '2027-01-20T10:00:00Z',
    status: 'published',
    tiers: [
      {
        id: 'tier-3',
        eventId: 'event-2',
        name: 'Standard',
        priceCents: 8000,
        capacity: 200,
        sold: 40,
        seatsLeft: 160,
      },
    ],
  },
  {
    id: 'event-3',
    title: 'West Africa Health Technology Forum',
    city: 'Accra',
    venue: 'Labadi Beach Hotel',
    startsAt: '2027-02-10T09:00:00Z',
    status: 'published',
    tiers: [
      {
        id: 'tier-4',
        eventId: 'event-3',
        name: 'Regular',
        priceCents: 10000,
        capacity: 150,
        sold: 30,
        seatsLeft: 120,
      },
    ],
  },

];