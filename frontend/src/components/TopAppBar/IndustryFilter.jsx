import React, {useState} from 'react';
import {Box, Button, Container} from '@mui/material';
import Tab from '@mui/material/Tab';
import Tabs, {tabsClasses} from '@mui/material/Tabs';

import {IndustryOptions} from './IndustryOptions';

const IndustryFilter = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          px: { xs: 0, md: 2 },
          alignItems: 'center',
          mt: 0,
          mb: 0,
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          sx={{
            [`& .${tabsClasses.scrollButtons}`]: {
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}
        >
          {IndustryOptions.map((industry) => {
            return <Tab key={industry.id} icon={industry.icon} label={industry.label} />;
          })}
        </Tabs>
      </Box>
    </Container>
  )
}

export default IndustryFilter