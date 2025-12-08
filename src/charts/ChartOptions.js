import { formatPrice } from "../utils/formatters";

export const getChartOptions = (timeScale, includeBlockTime) => {
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
          color: "#0E5353",
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
        color: "#0E5353",
        padding: 20,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#0E5353",
          callback: function (value) {
            return value.toFixed(1) + "s";
          },
        },
        grid: {
          color: "rgba(14, 83, 83, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "#0E5353",
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: "rgba(14, 83, 83, 0.1)",
        },
      },
    },
  };
};

export const getPriceChartOptions = (timeScale) => ({
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#0E5353",
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
      color: "#0E5353",
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
        color: "#0E5353",
        callback: function (value) {
          return formatPrice(value);
        },
      },
      grid: {
        color: "rgba(14, 83, 83, 0.1)",
      },
    },
    x: {
      ticks: {
        color: "#0E5353",
        maxRotation: 45,
        minRotation: 45,
      },
      grid: {
        color: "rgba(14, 83, 83, 0.1)",
      },
    },
  },
});
