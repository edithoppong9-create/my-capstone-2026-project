const bookings = new Map();


bookings.set('G%SLN75', { 
    owner: 'John Doe',
    seat: '12A',
});

export default bookings;

console.log(bookings.get('G%SLN75'));
