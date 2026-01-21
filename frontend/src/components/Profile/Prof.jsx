import React from "react";
import { Avatar, Stack, Typography, Grid } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

// TO DO:
// - Change source to users uploaded photo
// - Make taught and taken courses functional

export default function Prof(props) {
  return (
    <div>
      <Stack container>
        <Stack item align="center">
          <Avatar src={props.avatar} sx={{ width: 100, height: 100 }} />
        </Stack>

        <Stack item align="center">
          <Typography style={{ textAlign: "center" }} variant="h6">
            {props.name}
          </Typography>
        </Stack>

        <Stack item>
          <Grid
            container
            style={{ textAlign: "center", justifyContent: "center" }}
          >
            <Grid item xs={2}>
              <Typography
                style={{ textAlign: "left", paddingRight: 15 }}
                sx={{ fontSize: "10px" }}
              >
                {props.stars}
              </Typography>
            </Grid>

            {/* <Grid item xs={10} style={{textAlign:'left'}}>
              <StarIcon sx={{ fontSize: "8px", color: "gold" }} />
              <StarIcon sx={{ fontSize: "8px", color: "gold" }} />
              <StarIcon sx={{ fontSize: "8px", color: "gold" }} />
              <StarIcon sx={{ fontSize: "8px", color: "gold" }} />
              <StarIcon sx={{ fontSize: "8px" }} />
            </Grid> */}
          </Grid>
        </Stack>

        <Stack item>
          <Typography style={{ textAlign: "left" }} variant="h6">
            {props.generalTag}
          </Typography>
        </Stack>
      </Stack>
    </div>
  );
}
