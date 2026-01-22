import React, { useEffect, useRef } from "react";
import type { ChartData, ChartOptions, ChartType } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  PieController,
  DoughnutController,
} from "chart.js";
import { Loader } from "lucide-react";

// Register all Chart.js components and controllers
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  PieController,
  DoughnutController
);

interface ChartProps {
  type: ChartType;
  data: ChartData<ChartType>;
  options?: ChartOptions<ChartType>;
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
  const chartRef = useRef<ChartJS<ChartType> | null>(null);
  const chartIdRef = useRef<string>(`chart-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!canvasRef.current || loading || error || !data) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
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

    chartRef.current = new ChartJS(ctx, {
      type,
      data,
      options: {
        ...defaultOptions,
        ...options,
      },
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
      <canvas ref={canvasRef} id={chartIdRef.current}></canvas>
    </div>
  );
};

export default ChartComponent;
