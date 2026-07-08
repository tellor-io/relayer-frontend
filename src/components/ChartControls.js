import React from 'react';
import { TextField, Switch, FormControlLabel, Typography, useTheme } from '@mui/material';

export const ChartControls = ({
  timeScale,
  setTimeScale,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  includeBlockTime,
  setIncludeBlockTime,
  avgBlockTime,
  hideBlockTimeToggle = false,
}) => {
  const theme = useTheme();
  const emerald = theme.palette.secondary.main;
  const fg = theme.palette.text.primary;

  const fieldSx = {
    width: '180px',
    '& .MuiOutlinedInput-root': {
      color: fg,
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
    '& .MuiInputLabel-root': {
      color: 'text.secondary',
      '&.Mui-focused': { color: 'text.primary' },
    },
  };

  const TimeScaleToggle = () => (
    <div className="time-scale-toggle">
      {['recent', 'daily', 'weekly', 'custom'].map((scale) => (
        <button
          key={scale}
          type="button"
          onClick={() => setTimeScale(scale)}
          className={`time-scale-button ${timeScale === scale ? 'active' : ''}`}
        >
          {scale === 'custom' ? 'Date Range' : scale}
        </button>
      ))}
    </div>
  );

  const CustomDateRangeInputs = () => (
    <div className="custom-date-inputs">
      <TextField
        label="Start Date"
        type="datetime-local"
        value={customStartDate}
        onChange={(e) => setCustomStartDate(e.target.value)}
        size="small"
        InputLabelProps={{ shrink: true, style: { fontSize: '0.875rem' } }}
        inputProps={{ style: { fontSize: '0.875rem' } }}
        sx={fieldSx}
      />
      <TextField
        label="End Date"
        type="datetime-local"
        value={customEndDate}
        onChange={(e) => setCustomEndDate(e.target.value)}
        size="small"
        InputLabelProps={{ shrink: true, style: { fontSize: '0.875rem' } }}
        inputProps={{ style: { fontSize: '0.875rem' } }}
        sx={fieldSx}
      />
    </div>
  );

  const BlockTimeToggle = () => (
    <div className="block-time-toggle">
      <FormControlLabel
        control={
          <Switch
            checked={includeBlockTime}
            onChange={(e) => setIncludeBlockTime(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: emerald,
                '&:hover': { backgroundColor: `${emerald}14` },
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: emerald,
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
            Remove network Block Time
            {includeBlockTime && avgBlockTime > 0 && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                ({avgBlockTime.toFixed(1)}s avg)
              </span>
            )}
            {includeBlockTime && avgBlockTime === 0 && (
              <span style={{ marginLeft: '8px', opacity: 0.7, color: theme.palette.error.main }}>
                (Calculating...)
              </span>
            )}
          </Typography>
        }
      />
    </div>
  );

  return (
    <>
      {!hideBlockTimeToggle && <BlockTimeToggle />}
      <TimeScaleToggle />
      {timeScale === 'custom' && <CustomDateRangeInputs />}
    </>
  );
};
