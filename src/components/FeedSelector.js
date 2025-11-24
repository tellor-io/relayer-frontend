import React from "react";
import {
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
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
  const pairEntries = Object.entries(pairs);
  const isShortList = pairEntries.length <= 3;

  const renderFeedContent = (pairName, textColor) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: textColor,
      }}
    >
      {/* Risk Bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          gap: "1px",
          height: "10px",
          justifyContent: "flex-start",
          flexShrink: 0,
        }}
        title={`Risk Level: ${
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
                  : "rgba(255,255,255,0.3)",
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
          sx={{ color: "#0E5353", fontWeight: "bold", mb: 2, fontSize: "14px" }}
        >
          {label}:
          {loading && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "12px",
                opacity: 0.7,
                fontWeight: "normal",
              }}
            >
              (Loading...)
            </span>
          )}
        </Typography>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {pairEntries.map(([pairName, queryId]) => {
            const isSelected = value === pairName;

            return (
              <Box
                key={pairName}
                onClick={() =>
                  !loading && onChange({ target: { value: pairName } })
                }
                sx={{
                  height: "36px",
                  minWidth: "120px",
                  border: "2px solid #0E5353",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  cursor: loading ? "default" : "pointer",
                  backgroundColor: isSelected ? "#0E5353" : "transparent",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? "#0E5353"
                      : "rgba(14, 83, 83, 0.04)",
                  },
                  fontSize: "12px",
                }}
              >
                {renderFeedContent(pairName, isSelected ? "white" : "#0E5353")}
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
        sx={{ color: "#0E5353", fontWeight: "bold", mb: 2, fontSize: "14px" }}
      >
        {label}:
        {loading && (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "12px",
              opacity: 0.7,
              fontWeight: "normal",
            }}
          >
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
            color: "#0E5353",
            height: "36px",
            "& fieldset": { borderColor: "#0E5353", borderWidth: "2px" },
            "&:hover fieldset": { borderColor: "#0E5353", borderWidth: "2px" },
            "&.Mui-focused fieldset": {
              borderColor: "#0E5353",
              borderWidth: "2px",
            },
          },
          "& .MuiSelect-icon": { color: value ? "white" : "#0E5353" },
        }}
      >
        <InputLabel
          sx={{ color: value ? "white" : "#0E5353", display: "none" }}
        >
          Select Feed
        </InputLabel>
        <Select
          sx={{
            "& .MuiSelect-select": {
              backgroundColor: value ? "#0E5353" : "transparent",
              color: value ? "white" : "#0E5353",
            },
          }}
          value={value || ""}
          label="Select Feed"
          disabled={loading}
          displayEmpty
          onChange={onChange}
          renderValue={(selected) => {
            if (!selected) return <em>Select Feed</em>;
            return renderFeedContent(selected, "white");
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {pairEntries.map(([pairName, queryId]) => (
            <MenuItem key={pairName} value={pairName}>
              {renderFeedContent(pairName, "white")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};
