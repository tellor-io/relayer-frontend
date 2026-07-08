import { convertHexToDecimal, pickPointsAtTargetTimes } from "../utils/formatters";
import { getChartColors } from "../theme/tellorTheme";

export const preparePriceChartData = (
  dataset,
  timeScale,
  customStartDate,
  customEndDate,
  mode = 'light',
  includeRollingAverage = true
) => {
  if (!Array.isArray(dataset) || dataset.length === 0)
    return { labels: [], datasets: [] };

  const data = [...dataset].reverse();
  let processedData;

  switch (timeScale) {
    case "recent": {
      // Last 10 data points
      const recentData = data.slice(-10);

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
      // Last 10 days, one point per day at same timestamp (noon UTC)
      const targetTimestamps = [];
      const now = new Date();
      for (let i = 9; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(12, 0, 0, 0);
        targetTimestamps.push(d.getTime());
      }
      const recentData = pickPointsAtTargetTimes(data, targetTimestamps);

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
      // Last 10 weeks, one point per week at same timestamp (noon UTC, same day)
      const targetTimestamps = [];
      const now = new Date();
      for (let i = 9; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i * 7);
        d.setUTCHours(12, 0, 0, 0);
        targetTimestamps.push(d.getTime());
      }
      const recentData = pickPointsAtTargetTimes(data, targetTimestamps);

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
        // If no custom dates set, fall back to weekly view (10 weeks, same timestamp)
        const targetTimestamps = [];
        const now = new Date();
        for (let i = 9; i >= 0; i--) {
          const d = new Date(now);
          d.setUTCDate(d.getUTCDate() - i * 7);
          d.setUTCHours(12, 0, 0, 0);
          targetTimestamps.push(d.getTime());
        }
        const recentData = pickPointsAtTargetTimes(data, targetTimestamps);

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
      // Fall back to weekly view for any unexpected timeScale (10 weeks, same timestamp)
      const targetTimestamps = [];
      const now = new Date();
      for (let i = 9; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i * 7);
        d.setUTCHours(12, 0, 0, 0);
        targetTimestamps.push(d.getTime());
      }
      const recentData = pickPointsAtTargetTimes(data, targetTimestamps);

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

  const colors = getChartColors(mode);

  return {
    labels: processedData.labels,
    datasets: [
      ...(includeRollingAverage
        ? [
            {
              label: "Rolling Average",
              data: processedData.averagePrice,
              borderColor: colors.priceSecondary,
              backgroundColor: `${colors.priceSecondary}22`,
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0,
            },
          ]
        : []),
      {
        label: `${
          timeScale === "recent" ? "Current" : "Individual"
        } Price (USD)`,
        data: processedData.prices,
        borderColor: colors.pricePrimary,
        backgroundColor: `${colors.pricePrimary}33`,
        borderWidth: timeScale === "recent" ? 2 : 1,
        pointRadius: timeScale === "recent" ? 4 : 2,
        pointHoverRadius: timeScale === "recent" ? 6 : 4,
        pointBackgroundColor: colors.pricePrimary,
        pointBorderColor: colors.pricePrimary,
        tension: 0.1,
      },
    ],
  };
};
