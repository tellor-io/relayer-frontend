import { convertHexToDecimal } from "../utils/formatters";

export const preparePriceChartData = (
  dataset,
  timeScale,
  customStartDate,
  customEndDate
) => {
  if (!Array.isArray(dataset) || dataset.length === 0)
    return { labels: [], datasets: [] };

  const data = [...dataset].reverse();
  let processedData;

  switch (timeScale) {
    case "recent": {
      const last10Entries = data.slice(-10);

      const prices = last10Entries.map((item) => {
        return convertHexToDecimal(item.reportValue.toString());
      });

      // Calculate rolling average for benchmark line
      const rollingAverages = prices.map((_, index) => {
        const subset = prices.slice(0, index + 1);
        const validPrices = subset.filter(
          (price) => !isNaN(price) && price > 0
        );
        const avg =
          validPrices.length > 0
            ? validPrices.reduce((sum, price) => sum + price, 0) /
              validPrices.length
            : 0;
        // Round to 2 decimal places for consistent precision
        return Math.round(avg * 100) / 100;
      });

      processedData = {
        labels: last10Entries.map((item) =>
          new Date(item.reportTimestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })
        ),
        prices: prices,
        averagePrice: rollingAverages,
      };
      break;
    }

    case "daily": {
      // Get all data points from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let recentData = data.filter((item) => {
        const itemDate = new Date(item.reportTimestamp);
        return itemDate >= sevenDaysAgo;
      });

      // Limit to max 100 points to prevent overcrowding
      if (recentData.length > 100) {
        const step = Math.ceil(recentData.length / 100);
        recentData = recentData.filter((_, index) => index % step === 0);
      }

      const prices = recentData.map((item) => {
        return convertHexToDecimal(item.reportValue.toString());
      });

      const rollingAverages = prices.map((_, index) => {
        const subset = prices.slice(0, index + 1);
        const validPrices = subset.filter((price) => price > 0);
        const avg =
          validPrices.length > 0
            ? validPrices.reduce((sum, price) => sum + price, 0) /
              validPrices.length
            : 0;
        return Math.round(avg * 100) / 100;
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
        prices: prices,
        averagePrice: rollingAverages,
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

      const prices = recentData.map((item) => {
        return convertHexToDecimal(item.reportValue.toString());
      });

      const rollingAverages = prices.map((_, index) => {
        const subset = prices.slice(0, index + 1);
        const validPrices = subset.filter((price) => price > 0);
        const avg =
          validPrices.length > 0
            ? validPrices.reduce((sum, price) => sum + price, 0) /
              validPrices.length
            : 0;
        return Math.round(avg * 100) / 100;
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
        prices: prices,
        averagePrice: rollingAverages,
      };
      break;
    }

    case "custom": {
      // Handle custom date range
      if (!customStartDate || !customEndDate) {
        // If no custom dates set, fall back to weekly view
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        let recentData = data.filter((item) => {
          const timestamp = Number(item.reportTimestamp);
          const itemDate = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
          return itemDate >= fourWeeksAgo;
        });

        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }

        const prices = recentData.map((item) => {
          return convertHexToDecimal(item.reportValue.toString());
        });

        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(
            (price) => !isNaN(price) && price > 0
          );
          const avg =
            validPrices.length > 0
              ? validPrices.reduce((sum, price) => sum + price, 0) /
                validPrices.length
              : 0;
          return Math.round(avg * 100) / 100;
        });

        processedData = {
          labels: recentData.map((item) =>
            new Date(item.reportTimestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          ),
          prices: prices,
          averagePrice: rollingAverages,
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

        const prices = customData.map((item) => {
          return convertHexToDecimal(item.reportValue.toString());
        });

        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(
            (price) => !isNaN(price) && price > 0
          );
          const avg =
            validPrices.length > 0
              ? validPrices.reduce((sum, price) => sum + price, 0) /
                validPrices.length
              : 0;
          return Math.round(avg * 100) / 100;
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
          prices: prices,
          averagePrice: rollingAverages,
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

      const prices = recentData.map((item) => {
        return convertHexToDecimal(item.reportValue.toString());
      });

      const rollingAverages = prices.map((_, index) => {
        const subset = prices.slice(0, index + 1);
        const validPrices = subset.filter((price) => price > 0);
        const avg =
          validPrices.length > 0
            ? validPrices.reduce((sum, price) => sum + price, 0) /
              validPrices.length
            : 0;
        return Math.round(avg * 100) / 100;
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
        prices: prices,
        averagePrice: rollingAverages,
      };
      break;
    }
  }

  return {
    labels: processedData.labels,
    datasets: [
      {
        label: "Rolling Average",
        data: processedData.averagePrice,
        borderColor: "rgb(17, 122, 118)",
        backgroundColor: "rgba(183, 184, 184, 0.34)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0,
      },
      {
        label: `${
          timeScale === "recent" ? "Current" : "Individual"
        } Price (USD)`,
        data: processedData.prices,
        borderColor: "#00d6b9",
        backgroundColor: "rgb(66, 255, 255)",
        borderWidth: timeScale === "recent" ? 2 : 1,
        pointRadius: timeScale === "recent" ? 4 : 2,
        pointHoverRadius: timeScale === "recent" ? 6 : 4,
        pointBackgroundColor: "#00d6b9",
        pointBorderColor: "#00d6b9",
        tension: 0.1,
      },
    ],
  };
};
