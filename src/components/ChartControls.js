import React from 'react';
import { TextField, Switch, FormControlLabel, Typography } from '@mui/material';


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
}) => {
  const TimeScaleToggle = () => (
      <div className="time-scale-toggle">
        {["recent", "daily", "weekly", "custom"].map((scale) => (
          <button
            key={scale}
            onClick={() => setTimeScale(scale)}
            className={`time-scale-button ${timeScale === scale ? "active" : ""}`}
          >
            {scale === "custom" ? "Date Range" : scale}
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
          InputLabelProps={{
            shrink: true,
            style: { color: "#0E5353", fontSize: "0.875rem" },
          }}
          inputProps={{
            style: { color: "#0E5353", fontSize: "0.875rem" },
          }}
          sx={{
            width: "180px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#0E5353",
              },
              "&:hover fieldset": {
                borderColor: "#0E5353",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#0E5353",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#0E5353",
              "&.Mui-focused": {
                color: "#0E5353",
              },
            },
          }}
        />
        <TextField
          label="End Date"
          type="datetime-local"
          value={customEndDate}
          onChange={(e) => setCustomEndDate(e.target.value)}
          size="small"
          InputLabelProps={{
            shrink: true,
            style: { color: "#0E5353", fontSize: "0.875rem" },
          }}
          inputProps={{
            style: { color: "#0E5353", fontSize: "0.875rem" },
          }}
          sx={{
            width: "180px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#0E5353",
              },
              "&:hover fieldset": {
                borderColor: "#0E5353",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#0E5353",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#0E5353",
              "&.Mui-focused": {
                color: "#0E5353",
              },
            },
          }}
        />
      </div>
    );

  const BlockTimeToggle = () => (
      <div className="block-time-toggle">
        <FormControlLabel
          control={
            <Switch
              checked={includeBlockTime}
              onChange={(e) => {
                setIncludeBlockTime(e.target.checked);
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#00b96f",
                  "&:hover": {
                    backgroundColor: "rgba(0, 185, 111, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#00b96f",
                },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ color: "#0E5353", fontSize: "0.875rem" }}
            >
              Remove network Block Time
              {includeBlockTime && avgBlockTime > 0 && (
                <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                  ({avgBlockTime.toFixed(1)}s avg)
                </span>
              )}
              {includeBlockTime && avgBlockTime === 0 && (
                <span
                  style={{ marginLeft: "8px", opacity: 0.7, color: "#ff6b6b" }}
                >
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
      <BlockTimeToggle />
      <TimeScaleToggle />
      {timeScale === 'custom' && <CustomDateRangeInputs />}
    </>
  );
};