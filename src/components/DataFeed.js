import React, { useState, useEffect } from "react";
import { PaginationItem, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  getChartData,
  getPaginatedFeedData,
  getOverviewData,
} from "../services/grapqlService";

import {
  SEPOLIA_PRICE_PAIRS,
  BASE_PRICE_PAIRS,
  SAGA_PRICE_PAIRS,
  HIDE_SAGA_FEEDS,
  HIDE_DELAY_CHART,
} from "../constants/dataFeedConstants";

import {
  Container,
  Typography,
  Grid,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  useTheme,
} from "@mui/material";
import { FeedSelector } from "./FeedSelector";
import { Legends } from "./Legends";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import "../styles/DataFeed.css";
import { prepareRollingAverageChart } from "../charts/RollingAverageChart";
import { preparePriceChartData } from "../charts/PriceChart";
import { getChartOptions, getPriceChartOptions } from "../charts/ChartOptions";
import { AppTopbar } from "./AppTopbar";
import { useThemeMode } from "../context/ThemeModeContext";
import { TabSwitcher } from "./TabSwitcher";
import { OverviewTab } from "./OverviewTab";
import { ChartControls } from "./ChartControls";
import { TableContent } from "./TableContent";
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const DataFeed = () => {
  const { mode } = useThemeMode();
  const theme = useTheme();
  const activeBg = theme.palette.mode === 'dark'
    ? theme.palette.secondary.main
    : theme.palette.primary.main;
  const activeFg = theme.palette.primary.contrastText;
  // --- STATE ---
  const [data, setData] = useState([]);
  const [overviewData, setOverviewData] = useState([]);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [network, setNetwork] = useState("ethSepolia");
  const [explorer, setExplorer] = useState("https://sepolia.etherscan.io/tx/");
  const [queryId, setQueryId] = useState(SAGA_PRICE_PAIRS["ETH/USD"] || "");
  const [feedName, setFeedName] = useState("ETH/USD");
  const [timeScale, setTimeScale] = useState("recent");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeBlockTime, setIncludeBlockTime] = useState(true);
  const [avgBlockTime, setAvgBlockTime] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);
  // Add tab state for switching between data view and analytics
  const [activeTab, setActiveTab] = useState(0);
  const [overviewSortColumn, setOverviewSortColumn] = useState("network"); // 'feed' or 'network'
  const [overviewSortDirection, setOverviewSortDirection] = useState("asc"); // 'asc' or 'desc'

  useEffect(() => {
    // Set default block time based on network
    // 2 seconds for Saga, 12 seconds for Sepolia (Ethereum testnet)
    const defaultBlockTime = network !== "ethSepolia" ? 2 : 12;
    setAvgBlockTime(defaultBlockTime);
  }, [network]);

  useEffect(() => {
    async function fetchData(showLoader = false) {
      if (!queryId) return;


      if (showLoader) {
        setLoading(true);
      }
      
      try {
        const offset = (currentPage - 1) * pageSize;

        const result = await getPaginatedFeedData(
          queryId,
          network,
          pageSize,
          offset
        );
        setData(result.updates);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    fetchData(true);
    
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [currentPage, pageSize, network, queryId]);

  useEffect(() => {
    async function fetchChartData() {
      setChartLoading(true);
      try {
        let startTs, endTs;
        const now = Math.floor(Date.now() / 1000);
        switch (timeScale) {
          case "recent": {
            // Fetch enough data to get last 10 points (30 days covers sparse feeds)
            const thirtyDaysInSeconds = 30 * 24 * 3600;
            startTs = now - thirtyDaysInSeconds;
            const newData = await getChartData(queryId, network, startTs, now);
            setChartData(newData);
            break;
          }
          case "daily": {
            const tenDaysInHours = 24 * 10;
            startTs = now - tenDaysInHours * 3600;
            const newData = await getChartData(queryId, network, startTs, now);
            setChartData(newData);
            break;
          }
          case "weekly": {
            const tenWeeksInHours = 24 * 7 * 10;
            startTs = now - tenWeeksInHours * 3600;
            const newData = await getChartData(queryId, network, startTs, now);
            setChartData(newData);
            break;
          }
          case "custom": {
            if (!customStartDate || !customEndDate) {
              setChartData([]);
              break;
            }
            startTs = Math.floor(new Date(customStartDate).getTime() / 1000);
            endTs = Math.floor(new Date(customEndDate).getTime() / 1000);
            const newData = await getChartData(
              queryId,
              network,
              startTs,
              endTs
            );
            setChartData(newData);
            break;
          }
          default: {
            setChartData([]);
          }
        }
      } catch (error) {
        console.error("Chart fetch failed:", error);
      } finally {
        setChartLoading(false);
      }
    }

    fetchChartData();
  }, [timeScale, customStartDate, customEndDate, queryId, network]);


  useEffect(() => {
    if (activeTab !== 0) return;

    async function fetchOverviewData(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }
      try {
        const data = await getOverviewData();
        setOverviewData(data);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    fetchOverviewData(true);
    const interval = setInterval(() => fetchOverviewData(false), 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSepoliaClick = (event) => {
    const newFeedName = event.target.value;
    setNetwork("ethSepolia");
    setFeedName(newFeedName);
    setQueryId(SAGA_PRICE_PAIRS[newFeedName]);
    setExplorer("https://sepolia.etherscan.io/tx/");
    setCurrentPage(1);
  };

  const handleSagaClick = (event) => {
    const newFeedName = event.target.value;
    setNetwork("sagaEVM");
    setFeedName(newFeedName);
    setQueryId(SAGA_PRICE_PAIRS[newFeedName]);
    setExplorer("https://sagaevm.sagaexplorer.io/tx/");
    setCurrentPage(1);
  };

  const handleBaseClick = (event) => {
    const newFeedName = event.target.value;
    setNetwork("baseMainnet");
    setFeedName(newFeedName);
    setQueryId(SAGA_PRICE_PAIRS[newFeedName]);
    setExplorer("https://basescan.org/tx/");
    setCurrentPage(1);
  };

  const handleEthMainnetClick = (event) => {
    const newFeedName = event.target.value;
    setNetwork("ethMainnet");
    setFeedName(newFeedName);
    setQueryId(SAGA_PRICE_PAIRS[newFeedName]);
    setExplorer("https://etherscan.io/tx/");
    setCurrentPage(1);
  };

  return (
    <>
      <AppTopbar />
      <Container>
      {/* Tabs for Overview and Feed History */}
      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Tab Content */}
      {activeTab === 0 && (
        <OverviewTab
          overviewData={overviewData}
          loading={loading}
          overviewSortColumn={overviewSortColumn}
          overviewSortDirection={overviewSortDirection}
          setOverviewSortColumn={setOverviewSortColumn}
          setOverviewSortDirection={setOverviewSortDirection}
        />
      )}
      {activeTab === 1 && (
        <>
          {/* Feed Selection and Legends */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <div className="t-panel">
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Left Column - Feed Selectors */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <FeedSelector
                        label="Ethereum Feeds"
                        pairs={{'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992'}}
                        onChange={handleEthMainnetClick}
                        value={network === "ethMainnet" ? feedName : ""}
                      />
                    </div>
                    <div>
                      <FeedSelector
                        label="Sepolia Feeds"
                        pairs={SEPOLIA_PRICE_PAIRS}
                        onChange={handleSepoliaClick}
                        value={network === "ethSepolia" ? feedName : ""}
                      />
                    </div>
                    {!HIDE_SAGA_FEEDS && (
                    <div>
                      <FeedSelector
                        label="Saga Feeds"
                        pairs={SAGA_PRICE_PAIRS}
                        onChange={handleSagaClick}
                        value={network === "sagaEVM" ? feedName : ""}
                      />
                    </div>
                    )}
                    <div>
                      <FeedSelector
                        label="Base Feeds"
                        pairs={BASE_PRICE_PAIRS}
                        onChange={handleBaseClick}
                        value={network === "baseMainnet" ? feedName : ""}
                      />
                    </div>
                  </div>

                  {/* Right Column - Legends */}
                  <div style={{ display: "flex", alignItems: "flex-start", height: "100%" }}>
                    <Legends />
                  </div>
                </div>
              </div>

              {/* Side-by-Side Layout: Left (Data Feed) | Right (Charts) */}

              {/* Left Column - Data Feed */}
              <div className="datafeed-content">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <TableContent
                    reports={data}
                    feed={feedName}
                    loading={loading}
                    explorer={explorer}
                    includeBlockTime={includeBlockTime}
                    avgBlockTime={avgBlockTime}
                  />
                  {/* --- NEW PAGINATION BAR --- */}
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    className="t-pagination-bar"
                  >
                    {/* 1. Left Side: Rows Per Page Selector */}
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                        Rows per page:
                      </Typography>
                      <FormControl size="small">
                        <Select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          sx={{
                            color: "text.primary",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                            "& .MuiSvgIcon-root": { color: "text.primary" },
                            height: 32,
                          }}
                        >
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={25}>25</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    {/* 2. Right Side: The Page Numbers */}
                    <Pagination
                      count={Math.ceil(totalCount / pageSize)}
                      page={currentPage}
                      onChange={(_, value) => setCurrentPage(value)}
                      color="primary"
                      shape="rounded"
                      renderItem={(item) => (
                        <PaginationItem
                          slots={{
                            previous: ArrowBackIcon,
                            next: ArrowForwardIcon,
                          }}
                          {...item}
                          sx={{
                            color: "text.primary",
                            "&.Mui-selected": {
                              backgroundColor: activeBg,
                              color: activeFg,
                              "&:hover": {
                                backgroundColor: activeBg,
                                opacity: 0.9,
                              },
                            },
                          }}
                        />
                      )}
                    />
                  </Stack>
                </div>
              </div>
            </Grid>

            {/* Right Column - Charts */}
            <Grid item xs={12} md={5}>
              <div className="analytics-dashboard">
                {/* Chart header */}
                <div className="analytics-dashboard-header">
                  <Typography
                    variant="h6"
                    className="analytics-dashboard-title"
                  >
                    {chartLoading ? (
                      <div className="analytics-loading">
                        <CircularProgress
                          size={18}
                          className="loading-spinner"
                        />
                        Loading Chart...
                      </div>
                    ) : (
                      "Performance Analytics Dashboard"
                    )}
                  </Typography>
                </div>
                {!chartLoading && (
                  <ChartControls
                    includeBlockTime={includeBlockTime}
                    setIncludeBlockTime={setIncludeBlockTime}
                    avgBlockTime={avgBlockTime}
                    timeScale={timeScale}
                    setTimeScale={setTimeScale}
                    customStartDate={customStartDate}
                    setCustomStartDate={setCustomStartDate}
                    customEndDate={customEndDate}
                    setCustomEndDate={setCustomEndDate}
                    hideBlockTimeToggle={HIDE_DELAY_CHART}
                  />
                )}
                {!HIDE_DELAY_CHART && (
                  <div className="chart-container">
                    {chartLoading ? (
                      <div className="chart-loading">
                        <CircularProgress size={40} className="loading-spinner" />
                        <div>Loading chart data...</div>
                      </div>
                    ) : (
                      (() => {
                        const delayChartData = prepareRollingAverageChart(
                          chartData,
                          timeScale,
                          includeBlockTime,
                          customStartDate,
                          customEndDate,
                          avgBlockTime,
                          mode
                        );
                        const delayValues =
                          delayChartData.datasets?.[1]?.data ?? [];
                        const maxDelay =
                          delayValues.length > 0
                            ? Math.max(...delayValues)
                            : null;
                        return (
                          <Line
                            options={{
                              ...getChartOptions(
                                timeScale,
                                includeBlockTime,
                                maxDelay,
                                mode
                              ),
                              maintainAspectRatio: false,
                            }}
                            data={delayChartData}
                          />
                        );
                      })()
                    )}
                  </div>
                )}

                {/* Price Performance Chart */}
                <div className="chart-container">
                  {chartLoading ? (
                    <div className="chart-loading">
                      <CircularProgress size={40} className="loading-spinner" />
                      <div>Loading price chart data...</div>
                    </div>
                  ) : (
                    <Line
                      options={{
                        ...getPriceChartOptions(timeScale, mode),
                        maintainAspectRatio: false,
                      }}
                      data={preparePriceChartData(
                        chartData,
                        timeScale,
                        customStartDate,
                        customEndDate,
                        mode,
                        !HIDE_DELAY_CHART
                      )}
                    />
                  )}
                </div>

                {/* Chart footer */}
                <div className="chart-footer">
                  <Typography variant="caption" className="chart-footer-text">
                    Data updates every 30 seconds • Hover for detailed metrics
                  </Typography>
                </div>
              </div>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
    </>
  );
};

export default DataFeed;