import React from "react";
import { Tabs, Tab, Box, useTheme } from "@mui/material";

export const TabSwitcher = ({ activeTab, setActiveTab }) => {
  const theme = useTheme();

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{
          "& .MuiTab-root": {
            color: "text.secondary",
            fontWeight: 500,
            textTransform: "none",
            fontSize: "13px",
            minWidth: 120,
          },
          "& .Mui-selected": {
            color: "text.primary",
            fontWeight: 600,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.secondary.main,
            height: 2,
          },
        }}
      >
        <Tab label="Overview" />
        <Tab label="Feed Analytics" />
      </Tabs>
    </Box>
  );
};
