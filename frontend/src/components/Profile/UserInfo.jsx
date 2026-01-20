import { Typography, Stack, Grid } from "@mui/material";
import React from "react";

export default function UserInfo(props) {

    return (
        <div>
            <Stack>
                <Grid container style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'space-evenly' }}>

                    {
                        props.taken > 0 ?
                            <Grid item sx={6}>
                                <Stack>
                                    <Typography variant='gutterBottom'>{props.taken}</Typography>
                                </Stack>

                                <Stack>
                                    <Typography variant='gutterBottom'>Attended</Typography>
                                </Stack>
                            </Grid>
                            : <></>
                    }

                    {
                        props.taught > 0 ?
                            <Grid item sx={6}>
                                <Stack>
                                    <Typography variant='gutterBottom'>{props.taught}</Typography>
                                </Stack>
                                <Stack>
                                    <Typography variant='gutterBottom'>Hosted</Typography>
                                </Stack>
                            </Grid>
                            : <></>
                    }

                </Grid>
            </Stack>
        </div>
    );
}
