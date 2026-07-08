import { formatPrice } from "../utils/formatters";
import { getChartColors } from "../theme/tellorTheme";

export const getChartOptions = (timeScale, includeBlockTime, maxDelay, mode = 'light') => {
  const colors = getChartColors(mode);
  const yMax =
    maxDelay != null && maxDelay > 0
      ? Math.max(60, Math.ceil(maxDelay / 20) * 20)
      : 60;

  return {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: colors.legend,
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `Delay - ${
          timeScale === "recent"
            ? "Recent"
            : timeScale === "custom"
            ? "Custom Date Range"
            : "Detailed " +
              timeScale.charAt(0).toUpperCase() +
              timeScale.slice(1)
        } View${includeBlockTime ? " (Block Time Adjusted)" : ""}`,
        color: colors.legend,
        padding: 20,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: yMax,
        ticks: {
          color: colors.tick,
          stepSize: 20,
          autoSkip: false,
          callback: function (value) {
            return value.toFixed(1) + "s";
          },
        },
        grid: {
          color: colors.grid,
        },
      },
      x: {
        ticks: {
          color: colors.tick,
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: colors.grid,
        },
      },
    },
  };
};

export const getPriceChartOptions = (timeScale, mode = 'light') => {
  const colors = getChartColors(mode);

  return {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: colors.legend,
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `Price - ${
          timeScale === "recent"
            ? "Recent"
            : timeScale === "custom"
            ? "Custom Date Range"
            : "Detailed " + timeScale.charAt(0).toUpperCase() + timeScale.slice(1)
        } View`,
        color: colors.legend,
        padding: 20,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${formatPrice(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          color: colors.tick,
          callback: function (value) {
            return formatPrice(value);
          },
        },
        grid: {
          color: colors.grid,
        },
      },
      x: {
        ticks: {
          color: colors.tick,
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: colors.grid,
        },
      },
    },
  };
};
