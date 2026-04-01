import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { dashboardService } from "../../services/dashboard.service";
import { formatCurrency } from "../../utils/helpers";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#16161a",
      borderColor: "#2a2a35",
      borderWidth: 1,
      titleColor: "#f0f0f0",
      bodyColor: "#a0a0b0",
      callbacks: {
        label: (ctx: { parsed: { y: number } }) => ` ${formatCurrency(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#606070", font: { size: 11 } },
      grid: { color: "rgba(42,42,53,0.5)" },
    },
    y: {
      ticks: {
        color: "#606070",
        font: { size: 11 },
        callback: (v: number | string) => {
          const n = Number(v);
          return n >= 1_000_000
            ? `${(n / 1_000_000).toFixed(1)}jt`
            : n >= 1000
            ? `${(n / 1000).toFixed(0)}rb`
            : String(n);
        },
      },
      grid: { color: "rgba(42,42,53,0.5)" },
    },
  },
} as const;

const DashboardAnalytics = () => {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [dailyData, setDailyData] = useState<{ date: string; revenue: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: number; label: string; revenue: number }[]>([]);
  const [yearlyData, setYearlyData] = useState<{ year: string; revenue: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      dashboardService.getDailyRevenue(30),
      dashboardService.getMonthlyRevenue(),
      dashboardService.getYearlyRevenue(),
    ]).then(([d, m, y]) => {
      setDailyData(d.data);
      setMonthlyData(m.data);
      setYearlyData(y.data);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const getChartData = () => {
    const accentRed = "#e5152b";
    const gradient = (ctx: CanvasRenderingContext2D, h: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(229,21,43,0.3)");
      g.addColorStop(1, "rgba(229,21,43,0)");
      return g;
    };

    if (period === "daily") {
      return {
        labels: dailyData.map((d) => d.date.slice(5)), // MM-DD
        datasets: [{
          data: dailyData.map((d) => d.revenue),
          backgroundColor: (ctx: { chart: ChartJS }) => {
            const c = ctx.chart.ctx;
            return gradient(c, ctx.chart.chartArea?.height ?? 300);
          },
          borderColor: accentRed,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: accentRed,
        }],
      };
    }

    if (period === "monthly") {
      return {
        labels: monthlyData.map((d) => d.label),
        datasets: [{
          data: monthlyData.map((d) => d.revenue),
          backgroundColor: (ctx: { chart: ChartJS }) => {
            const c = ctx.chart.ctx;
            return gradient(c, ctx.chart.chartArea?.height ?? 300);
          },
          borderColor: accentRed,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: accentRed,
        }],
      };
    }

    return {
      labels: yearlyData.map((d) => d.year),
      datasets: [{
        data: yearlyData.map((d) => d.revenue),
        backgroundColor: "rgba(229,21,43,0.6)",
        borderColor: accentRed,
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  };

  const totalRevenue =
    period === "daily"
      ? dailyData.reduce((s, d) => s + d.revenue, 0)
      : period === "monthly"
      ? monthlyData.reduce((s, d) => s + d.revenue, 0)
      : yearlyData.reduce((s, d) => s + d.revenue, 0);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-white tracking-wider">ANALITIK</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Pantau pendapatan eventmu</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(["daily", "monthly", "yearly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? "bg-[var(--accent-red)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)]"
            }`}
          >
            {p === "daily" ? "30 Hari" : p === "monthly" ? "Bulanan" : "Tahunan"}
          </button>
        ))}
      </div>

      {/* Total revenue card */}
      <div className="inline-flex items-center gap-4 px-6 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Pendapatan</p>
          <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        {isLoading ? (
          <div className="skeleton h-72 rounded-xl" />
        ) : (
          <div className="h-72">
            {period === "yearly" ? (
              <Bar
                data={getChartData() as any}
                options={CHART_OPTIONS as any}
              />
            ) : (
              <Line
                data={getChartData() as any}
                options={CHART_OPTIONS as any}
              />
            )}
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      {period === "monthly" && !isLoading && (
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-white text-sm">Rincian per Bulan</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[var(--text-secondary)]">{d.label}</span>
                <span className={`text-sm font-medium ${d.revenue > 0 ? "text-white" : "text-[var(--text-muted)]"}`}>
                  {formatCurrency(d.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;
