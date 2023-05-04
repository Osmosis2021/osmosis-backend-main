import axios from 'axios'
import React, { useEffect, useState } from 'react'

function BookingPage() {

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('/bookings').then(response => {
      setBookings(response.data);
    })

  }, [])


  return (
    <>
      <h1>BookingPage</h1>
      {
        bookings?.length > 0 && bookings.map(booking => (
          <>
            {booking.numberOfGuests}
          </>
        ))
      }
    </>
  )
}

export default BookingPage