import React, { useEffect, useRef } from "react";
import { Loader } from "lucide-react";

interface ChartProps {
  type: "line" | "bar" | "pie" | "doughnut";
  data: any;
  options?: any;
  title?: string;
  loading?: boolean;
  error?: boolean;
  height?: number;
}

/**
 * Chart component - wrapper for chart visualization
 * Note: Requires chart.js to be installed and configured
 */
export const ChartComponent: React.FC<ChartProps> = ({
  type,
  data,
  options = {},
  title,
  loading = false,
  error = false,
  height = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || error || !data) return;

    // Dynamic import of Chart.js
    import("chart.js").then(async (ChartJS) => {
      const Chart = ChartJS.Chart;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current!.getContext("2d");
      if (!ctx) return;

      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "top" as const,
            labels: {
              usePointStyle: true,
              padding: 15,
            },
          },
          title: {
            display: title ? true : false,
            text: title || "",
            padding: {
              bottom: 30,
            },
          },
        },
      };

      chartRef.current = new Chart(ctx, {
        type,
        data,
        options: {
          ...defaultOptions,
          ...options,
        },
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options, title, loading, error]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 dark:bg-red-900 rounded-lg"
        style={{ height }}
      >
        <p className="text-red-600 dark:text-red-300">
          Error loading chart data
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      style={{ height }}
    >
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default ChartComponent;
