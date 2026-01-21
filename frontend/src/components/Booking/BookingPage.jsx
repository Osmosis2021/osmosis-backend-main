import axios from 'axios'
import React, { useEffect, useState } from 'react'
import TERMS from '../../constants/terms.js'

function BookingPage() {

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('/bookings').then(response => {
      setBookings(response.data);
    })

  }, [])


  return (
    <>
      <h1>{TERMS.BOOKING} Page</h1>
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