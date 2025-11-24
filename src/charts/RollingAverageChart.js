import { calculateTimeDifferenceFormatted } from "../utils/formatters";

export const prepareRollingAverageChart = (
  dataset,
  timeScale,
  includeBlockTime,
  customStartDate,
  customEndDate,
  avgBlockTime = 0
) => {
  if (!Array.isArray(dataset) || dataset.length === 0)
    return { labels: [], datasets: [] };
  const data = [...dataset].reverse();
  let processedData;
  switch (timeScale) {
    case "recent": {
      const last10Entries = data.slice(-10);
      const delays = last10Entries.map((item) => {
        let timeDiff = calculateTimeDifferenceFormatted(
          item.reportTimestamp,
          item.relayTimestamp
        );
        let delay = parseFloat(timeDiff);
        if (timeDiff.includes("m")) {
          const [min, sec] = timeDiff.split("m");
          delay = parseInt(min) * 60 + parseFloat(sec.replace("s", ""));
        }
        // Subtract block time if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          delay = Math.max(0, delay - avgBlockTime);
        }
        return delay;
      });

      const rollingAverages = delays.map((_, index) => {
        const subset = delays.slice(0, index + 1);
        return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
      });

      processedData = {
        labels: last10Entries.map((item) =>
          new Date(item.reportTimestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })
        ),
        delays: delays,
        averageDelay: rollingAverages,
      };
      break;
    }
    case "daily": {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get all data points from the last 7 days
      let recentData = data.filter((item) => {
        const itemDate = new Date(item.reportTimestamp);
        return itemDate >= sevenDaysAgo;
      });
      
      // Limit to max 100 points to prevent overcrowding
      if (recentData.length > 100) {
        const step = Math.ceil(recentData.length / 100);
        recentData = recentData.filter((_, index) => index % step === 0);
      }

      const delays = recentData.map((item) => {
        const reportDate = new Date(item.reportTimestamp);
        const relayDate = new Date(item.relayTimestamp);
        let delayInSeconds = (relayDate - reportDate) / 1000;
        // Subtract block time if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          delayInSeconds = Math.max(0, delayInSeconds - avgBlockTime);
        }
        return delayInSeconds;
      });

      // Calculate rolling average for benchmark line
      let runningSum = 0;
      const rollingAverages = delays.map((delay, index) => {
        runningSum += delay;
        return runningSum / (index + 1);
      });

      processedData = {
        labels: recentData.map((item) => {
          const date = new Date(item.reportTimestamp);
          return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }),
        delays: delays,
        averageDelay: rollingAverages,
      };
      break;
    }
    case "weekly": {
      // Get all data points from the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      let recentData = data.filter((item) => {
        const itemDate = new Date(item.reportTimestamp);
        return itemDate >= fourWeeksAgo;
      });

      // Limit to max 200 points to prevent overcrowding
      if (recentData.length > 200) {
        const step = Math.ceil(recentData.length / 200);
        recentData = recentData.filter((_, index) => index % step === 0);
      }

      const delays = recentData.map((item) => {
        let timeDiff = calculateTimeDifferenceFormatted(
          item.reportTimestamp,
          item.relayTimestamp
        );
        let delay = parseFloat(timeDiff);
        if (timeDiff.includes("m")) {
          const [min, sec] = timeDiff.split("m");
          delay = parseInt(min) * 60 + parseFloat(sec.replace("s", ""));
        }
        // Subtract block time if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          delay = Math.max(0, delay - avgBlockTime);
        }
        return delay;
      });

      // Calculate rolling average for benchmark line
      const rollingAverages = delays.map((_, index) => {
        const subset = delays.slice(0, index + 1);
        return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
      });

      processedData = {
        labels: recentData.map((item) => {
          const date = new Date(item.reportTimestamp);
          return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }),
        delays: delays,
        averageDelay: rollingAverages,
      };
      break;
    }
    case "custom": {
      console.log("Processing custom date range in chart:", {
        dataLength: dataset?.length,
        customStartDate,
        customEndDate
      });
      // Handle custom date range
      if (!customStartDate || !customEndDate) {
        // If no custom dates set, fall back to weekly view
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        let recentData = data.filter(
          (item) => new Date(item.reportTimestamp) >= fourWeeksAgo
        );

        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }

        const delays = recentData.map((item) => {
          let timeDiff = calculateTimeDifferenceFormatted(
            item.reportTimestamp,
            item.relayTimestamp
          );
          let delay = parseFloat(timeDiff);
          if (timeDiff.includes("m")) {
            const [min, sec] = timeDiff.split("m");
            delay = parseInt(min) * 60 + parseFloat(sec.replace("s", ""));
          }
          return delay;
        });

        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });

        processedData = {
          labels: recentData.map((item) =>
            new Date(Number(item.reportTimestamp)).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          ),
          delays: delays,
          averageDelay: rollingAverages,
        };
      } else {
        // Filter data by custom date range
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);

        let customData = data.filter((item) => {
          const itemDate = new Date(item.reportTimestamp);
          return itemDate >= startDate && itemDate <= endDate;
        });

        // Limit to max 300 points to prevent overcrowding
        if (customData.length > 300) {
          const step = Math.ceil(customData.length / 300);
          customData = customData.filter((_, index) => index % step === 0);
        }

        const delays = customData.map((item) => {
          let timeDiff = calculateTimeDifferenceFormatted(
            item.reportTimestamp,
            item.relayTimestamp
          );
          let delay = parseFloat(timeDiff);
          if (timeDiff.includes("m")) {
            const [min, sec] = timeDiff.split("m");
            delay = parseInt(min) * 60 + parseFloat(sec.replace("s", ""));
          }
          // Subtract block time if enabled
          if (includeBlockTime && avgBlockTime > 0) {
            delay = Math.max(0, delay - avgBlockTime);
          }
          return delay;
        });

        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });

        processedData = {
          labels: customData.map((item) => {
            const date = new Date(item.reportTimestamp);
            return date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }),
          delays: delays,
          averageDelay: rollingAverages,
        };
      }
      break;
    }
    default: {
      // Fall back to weekly view for any unexpected timeScale
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      let recentData = data.filter(
        (item) => new Date(item.reportTimestamp) >= fourWeeksAgo
      );

      if (recentData.length > 200) {
        const step = Math.ceil(recentData.length / 200);
        recentData = recentData.filter((_, index) => index % step === 0);
      }

      const delays = recentData.map((item) => {
        let timeDiff = calculateTimeDifferenceFormatted(
          item.reportTimestamp,
          item.relayTimestamp
        );
        let delay = parseFloat(timeDiff);
        if (timeDiff.includes("m")) {
          const [min, sec] = timeDiff.split("m");
          delay = parseInt(min) * 60 + parseFloat(sec.replace("s", ""));
        }
        // Subtract block time if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          delay = Math.max(0, delay - avgBlockTime);
        }
        return delay;
      });

      const rollingAverages = delays.map((_, index) => {
        const subset = delays.slice(0, index + 1);
        return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
      });

      processedData = {
        labels: recentData.map((item) => {
          const date = new Date(item.reportTimestamp);
          return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }),
        delays: delays,
        averageDelay: rollingAverages,
      };
      break;
    }
  }

  return {
    labels: processedData.labels,
    datasets: [
      {
        label: "Rolling Average",
        data: processedData.averageDelay,
        borderColor: "#4e597b",
        backgroundColor: "rgba(78, 89, 123, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0,
      },
      {
        label: `${timeScale === "recent" ? "Current" : "Individual"} Delay${
          includeBlockTime ? " (Block Time Adj.)" : ""
        } (seconds)`,
        data: processedData.delays,
        borderColor: "#00b96f",
        backgroundColor: "rgba(0, 185, 111, 0.2)",
        borderWidth: timeScale === "recent" ? 2 : 1,
        pointRadius: timeScale === "recent" ? 4 : 2,
        pointHoverRadius: timeScale === "recent" ? 6 : 4,
        pointBackgroundColor: "#00b96f",
        pointBorderColor: "#00b96f",
        tension: 0.1,
      },
    ],
  };
};
