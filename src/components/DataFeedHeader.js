import React from 'react';
import { Grid, Box } from '@mui/material';

export const DataFeedHeader = () => {
  return (
    <Grid container alignItems="center" sx={{ mt: 4, mb: 1.0 }}>
        <Grid item xs={12} sm={6} sx={{ mb: { xs: 2, sm: 0 } }}>
          <Box
            component="img"
            src="/tellor-feeds-logo.png"
            alt="Tellor Feeds"
            sx={{
              height: { xs: '60px', sm: '80px' },
              width: 'auto',
              maxWidth: '100%',
              display: 'block'
            }}
          />
          
        </Grid>
      </Grid>
  );
};
