import { performance } from 'node:perf_hooks';

const sizes = [100_000, 200_000, 400_000];

console.log('Booking lookup benchmark');
console.log('Comparing Map.get() with Array.find()\n');

for (const size of sizes) {
  const bookingsByReference = new Map();
  const bookings = [];

  for (let i = 0; i < size; i += 1) {
    const booking = {
      reference: `BOOKING-${i}`,
      attendeeName: `Attendee ${i}`,
    };

    bookingsByReference.set(booking.reference, booking);
    bookings.push(booking);
  }

  const targetReference = `BOOKING-${size - 1}`;
  const repetitions = 100;

  const mapStart = performance.now();

  for (let i = 0; i < repetitions; i += 1) {
    bookingsByReference.get(targetReference);
  }

  const mapTime = performance.now() - mapStart;

  const arrayStart = performance.now();

  for (let i = 0; i < repetitions; i += 1) {
    bookings.find((booking) => booking.reference === targetReference);
  }

  const arrayTime = performance.now() - arrayStart;

  console.log(`Bookings: ${size.toLocaleString()}`);
  console.log(`  Map.get():  ${mapTime.toFixed(3)} ms`);
  console.log(`  Array.find(): ${arrayTime.toFixed(3)} ms`);
  console.log('');
}