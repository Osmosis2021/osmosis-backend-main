import * as React from "react";
import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { IconButton } from "@mui/material";
import Calendar from "../Calendar/Calendar";

export default function CalendarViewButton() {
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          <Button
            onClick={toggleDrawer(anchor, true)}
            sx={{ fontSize: "15px" }}
          >
            <CalendarMonthIcon />
            <pre> </pre>Calendar
          </Button>
          <SwipeableDrawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
            onOpen={toggleDrawer(anchor, true)}
          >
            <Calendar />
            <IconButton
              // edge="start"
              justifyContent="center"
              style={{
                fontSize: 42,
                backgroundColor: "red",
                width: 50,
                height: 50,
                color: "white",
                marginLeft: "0.5rem",
              }}
              onClick={toggleDrawer(anchor, false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </SwipeableDrawer>
        </React.Fragment>
      ))}
    </div>
  );
}
