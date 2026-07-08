import React from "react";
import {
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  useTheme,
} from "@mui/material";
import {
  getFeedTypeSymbol,
  RISK_BAR_COUNT,
  FEED_RISK_ASSESSMENT,
} from "../constants/dataFeedConstants";

export const FeedSelector = ({
  label,
  value,
  onChange,
  pairs,
  loading = false,
}) => {
  const theme = useTheme();
  const pairEntries = Object.entries(pairs);
  const isShortList = pairEntries.length <= 3;
  const activeBg = theme.palette.mode === 'dark'
    ? theme.palette.secondary.main
    : theme.palette.primary.main;
  const activeFg = theme.palette.mode === 'dark'
    ? theme.palette.primary.contrastText
    : theme.palette.primary.contrastText;
  const idleColor = theme.palette.text.primary;

  const renderFeedContent = (pairName, textColor) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: textColor,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          gap: "1px",
          height: "10px",
          justifyContent: "flex-start",
          flexShrink: 0,
        }}
        title={`BP Rating: ${
          FEED_RISK_ASSESSMENT[pairName] === "exemplary"
            ? "Exemplary (3/3)"
            : FEED_RISK_ASSESSMENT[pairName] === "moderate"
            ? "Moderate (2/3)"
            : "High Risk (1/3)"
        }`}
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            style={{
              width: "6px",
              height: "2px",
              backgroundColor:
                index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT[pairName] || "high"]
                  ? textColor
                  : `${textColor}4D`,
              borderRadius: "1px",
            }}
          />
        ))}
      </div>
      {getFeedTypeSymbol(pairName, textColor)}
      <span>{pairName}</span>
    </div>
  );

  if (isShortList) {
    return (
      <div>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", fontWeight: 600, mb: 2, fontSize: "14px" }}
        >
          {label}:
          {loading && (
            <span style={{ marginLeft: "8px", fontSize: "12px", opacity: 0.7, fontWeight: "normal" }}>
              (Loading...)
            </span>
          )}
        </Typography>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {pairEntries.map(([pairName]) => {
            const isSelected = value === pairName;

            return (
              <Box
                key={pairName}
                onClick={() => !loading && onChange({ target: { value: pairName } })}
                sx={{
                  height: "36px",
                  minWidth: "120px",
                  border: "1px solid",
                  borderColor: isSelected ? "transparent" : "divider",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  cursor: loading ? "default" : "pointer",
                  backgroundColor: isSelected ? activeBg : "transparent",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.12s",
                  "&:hover": {
                    backgroundColor: isSelected ? activeBg : "action.hover",
                  },
                  fontSize: "12px",
                }}
              >
                {renderFeedContent(pairName, isSelected ? activeFg : idleColor)}
              </Box>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Typography
        variant="body2"
        sx={{ color: "text.primary", fontWeight: 600, mb: 2, fontSize: "14px" }}
      >
        {label}:
        {loading && (
          <span style={{ marginLeft: "8px", fontSize: "12px", opacity: 0.7, fontWeight: "normal" }}>
            (Loading...)
          </span>
        )}
      </Typography>

      <FormControl
        size="small"
        sx={{
          minWidth: 125,
          height: "36px",
          "& .MuiOutlinedInput-root": {
            color: value ? activeFg : idleColor,
            backgroundColor: value ? activeBg : "transparent",
            height: "36px",
            borderRadius: "9999px",
            "& fieldset": { borderColor: "divider" },
            "&:hover fieldset": { borderColor: "primary.main" },
            "&.Mui-focused fieldset": { borderColor: "primary.main" },
          },
          "& .MuiSelect-icon": { color: value ? activeFg : idleColor },
        }}
      >
        <InputLabel sx={{ display: "none" }}>Select Feed</InputLabel>
        <Select
          sx={{
            "& .MuiSelect-select": {
              color: value ? activeFg : idleColor,
              borderRadius: "9999px",
            },
          }}
          value={value || ""}
          label="Select Feed"
          disabled={loading}
          displayEmpty
          onChange={onChange}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: "background.paper",
                "& .MuiMenuItem-root": {
                  color: "text.primary",
                  "&.Mui-selected": {
                    backgroundColor: activeBg,
                    color: activeFg,
                    "&:hover": { backgroundColor: activeBg },
                  },
                },
              },
            },
          }}
          renderValue={(selected) => {
            if (!selected) {
              return (
                <em style={{ color: theme.palette.text.secondary, fontStyle: "italic" }}>
                  Select Feed
                </em>
              );
            }
            return renderFeedContent(selected, activeFg);
          }}
        >
          <MenuItem value="" sx={{ color: "text.secondary" }}>
            <em>None</em>
          </MenuItem>
          {pairEntries.map(([pairName]) => {
            const isSelected = value === pairName;
            return (
              <MenuItem key={pairName} value={pairName}>
                {renderFeedContent(pairName, isSelected ? activeFg : idleColor)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
};
