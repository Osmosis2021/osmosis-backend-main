import React, { useEffect, useState } from "react";
import { Button, Grid, Typography, Drawer, Card } from "@mui/material";
import { useParams } from "react-router-dom";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import axios from "axios";
import useStore from "../../store";

import styles from "./calendar.module.css";
// import "./calendar.module.css";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState(null);
  const pageUserName = useParams()?.userName;
  const axiosPrivate = useAxiosPrivate();
  const { userName, isTeacher } = useStore();
  const [teacherBookings, setTeacherBookings] = useState([]);
  const [studentBookings, setStudentBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const getBookingInfo = async () => {
      try {
        const teacherResponse = await axiosPrivate.get(
          `booking/teacherBookings/${userName}`
        );
        const studentResponse = await axiosPrivate.get(
          `booking/bookings/${userName}`
        );

        // Check if the responses are successful before accessing data
        if (teacherResponse.status === 200 && studentResponse.status === 200) {
          console.log("Teacher bookings:", teacherResponse.data);
          console.log("Student bookings:", studentResponse.data);

          setTeacherBookings(teacherResponse.data);
          setStudentBookings(studentResponse.data);
          setBookings(isTeacher ? teacherResponse.data : studentResponse.data);
        } else {
          console.error(
            "Error fetching data. Status codes:",
            teacherResponse.status,
            studentResponse.status
          );
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    getBookingInfo();
  }, [userName]);

  const hasBookingsForDay = (day) => {
    return bookings?.some((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getUTCFullYear() === day.getUTCFullYear() &&
        bookingDate.getUTCMonth() === day.getUTCMonth() &&
        bookingDate.getUTCDate() === day.getUTCDate()
      );
    });
  };

  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day) => async (event) => {
    setAnchorEl(event.currentTarget);

    const clickedDate = new Date(
      Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
    );
    const bookingForDay = bookings.find((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getUTCFullYear() === clickedDate.getUTCFullYear() &&
        bookingDate.getUTCMonth() === clickedDate.getUTCMonth() &&
        bookingDate.getUTCDate() === clickedDate.getUTCDate()
      );
    });

    setSelectedBooking(bookingForDay);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const isCurrentDay = (day) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  };

  const open = Boolean(anchorEl);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startingDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();
  const daysInMonth = getCalendarDays(selectedDate);

  return (
    <Card style={{ margin: "2%", padding: "2%" }}>
      <Grid container justifyContent="space-between">
        <Grid item>
          <Button
            variant="outlined"
            onClick={handlePrevMonth}
            sx={{ px: { xs: "5px", md: "30px" } }}
          >
            <ArrowRightIcon sx={{ transform: "rotate(180deg)" }} />
            <pre> </pre>Previous Month
          </Button>
        </Grid>

        <Grid item>
          <Typography variant="h5">
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              year: "numeric",
            }).format(selectedDate)}
          </Typography>
        </Grid>

        <Grid item>
          <Button
            variant="outlined"
            onClick={handleNextMonth}
            sx={{ px: { xs: "5px", md: "30px" } }}
          >
            Next Month <pre> </pre>
            <ArrowRightIcon />
          </Button>
        </Grid>
      </Grid>

      {/* Weekday headers */}
      <Grid container spacing={2} style={{ marginTop: "10px" }}>
        {weekdays.map((day, index) => (
          <Grid
            item
            key={index}
            style={{ textAlign: "center", width: "calc(100% / 7)" }}
          >
            <Typography variant="subtitle2">{day}</Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar days */}
      <Grid
        container
        spacing={2}
        textAlign="center"
        sx={{ pr: { xs: "11px", md: "0px" } }}
      >
        {[...Array(startingDay)].map((_, index) => (
          <Grid item key={index} style={{ width: "calc(100% / 7)" }}></Grid>
        ))}

        {daysInMonth.map((day, index) => (
          <Grid item key={index} style={{ width: "calc(100% / 7)" }}>
            <button
              onClick={handleDayClick(day)}
              className={styles.calendar_day}
              style={{
                backgroundColor: isCurrentDay(day)
                  ? "#808080"
                  : hasBookingsForDay(day)
                  ? "#fff"
                  : "#00aeef",
                color: hasBookingsForDay(day) ? "#000" : "",
              }}
            >
              {day.getDate()}
            </button>
          </Grid>
        ))}
      </Grid>

      {/* Popup for displaying schedule */}
      <Drawer
        open={open}
        // anchorEl={anchorEl}
        anchor="bottom"
        onClose={handleClosePopover}
      >
        <div style={{ padding: "10px", height: "45vh" }}>
          {/* Display booking information if available */}
          {selectedBooking ? (
            <div>
              {/* <Typography variant="h6">Booking Details</Typography>
                            <Typography>Date: {selectedBooking.date}</Typography>
                            <Typography>Time: {selectedBooking.time}</Typography>
                            <Typography>Student: {selectedBooking.studentUserName}</Typography> */}
              <Typography variant="h6" sx={{ textAlign: "center" }}>
                Booking Details
              </Typography>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Date:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.date}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Time:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.time}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Student:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.studentUserName}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">
                  Number of Guests:
                </p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.numberOfGuests}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Total Amount:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.total}
                </p>
              </div>
              <br />

              {/* Display course information */}
              <Typography variant="h6" sx={{ textAlign: "center" }}>
                Course Details
              </Typography>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Course Title:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.courseID.courseTitle}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">
                  Course Description:
                </p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.courseID.courseDescription}
                </p>
              </div>
              <div className="flex justify-center items-center gap-12">
                <p className="w-[48%] text-right inline-block">Location:</p>
                <p className="flex-1 text-left inline-block">
                  {selectedBooking.courseID.address.city},{" "}
                  {selectedBooking.courseID.address.state}
                </p>
              </div>
              {/* Add more details as needed */}
              <br />
            </div>
          ) : (
            // Display a message when no booking is available
            <Typography>No bookings for this day.</Typography>
          )}
        </div>
      </Drawer>
    </Card>
  );
};

// Helper function to get an array of days in the current month
const getCalendarDays = (date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const daysInMonth = [];

  for (
    let day = firstDayOfMonth;
    day <= lastDayOfMonth;
    day.setDate(day.getDate() + 1)
  ) {
    daysInMonth.push(new Date(day));
  }

  return daysInMonth;
};

export default Calendar;
