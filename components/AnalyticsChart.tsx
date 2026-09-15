import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Feedback {
  createdAt: string;
  totalScore: number;
}

interface AnalyticsChartProps {
  feedbacks: Feedback[];
}

function getPast7DaysData(feedbacks: Feedback[]) {
  const days = [];
  const today = dayjs();
  for (let i = 6; i >= 0; i--) {
    const date = today.subtract(i, "day");
    const dateStr = date.format("YYYY-MM-DD");
    const feedback = feedbacks.find((fb) => dayjs(fb.createdAt).format("YYYY-MM-DD") === dateStr);
    days.push({
      date: date.format("ddd"),
      score: feedback ? feedback.totalScore : 0,
    });
  }
  return days;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const first = payload[0];
    if (!first) return null;
    return (
      <div className="rounded-xl border border-purple-400 bg-[#1a1625]/95 px-4 py-2 shadow-xl backdrop-blur-md">
        <p className="font-mono text-base font-bold text-purple-300">{label}</p>
        <p className="font-mono text-white">
          Score: <span className="font-bold">{first.value}/100</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsChart({ feedbacks }: AnalyticsChartProps) {
  const data = getPast7DaysData(feedbacks);

  return (
    <div
      className="flex w-full max-w-full items-center justify-center rounded-2xl border border-purple-500 bg-[#181824]/90 p-2 shadow-xl"
      style={{ minHeight: 260 }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="6 6" stroke="#a259f7" opacity={0.18} />
          <XAxis
            dataKey="date"
            stroke="#e0d7ff"
            tick={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}
            axisLine={{ stroke: "#a259f7" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#e0d7ff"
            tick={{ fontSize: 15, fontFamily: "monospace" }}
            axisLine={{ stroke: "#a259f7" }}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#a259f7", strokeWidth: 2, opacity: 0.18 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#a259f7"
            strokeWidth={4}
            dot={{ r: 8, fill: "#a259f7", stroke: "#181824", strokeWidth: 2 }}
            activeDot={{ r: 12, fill: "#a259f7", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
