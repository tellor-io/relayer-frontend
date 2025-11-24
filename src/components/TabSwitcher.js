import React from "react";
import { Tabs, Tab, Box } from "@mui/material";

export const TabSwitcher = ({ activeTab, setActiveTab }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{
          "& .MuiTab-root": {
            color: "#0E5353",
            fontWeight: "normal",
            textTransform: "none",
            fontSize: "16px",
            minWidth: 120,
          },
          "& .Mui-selected": {
            color: "#0E5353",
            fontWeight: "bold",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#0E5353",
            height: 3,
          },
        }}
      >
        <Tab label="Overview" />
        <Tab label="Feed Analytics" />
      </Tabs>
    </Box>
  );
};
