import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

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
    const date = today.subtract(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const feedback = feedbacks.find(fb => dayjs(fb.createdAt).format('YYYY-MM-DD') === dateStr);
    days.push({
      date: date.format('ddd'),
      score: feedback ? feedback.totalScore : 0,
    });
  }
  return days;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1625]/95 border border-purple-400 rounded-xl px-4 py-2 shadow-xl backdrop-blur-md">
        <p className="text-purple-300 font-bold text-base font-mono">{label}</p>
        <p className="text-white font-mono">Score: <span className="font-bold">{payload[0].value}/100</span></p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsChart({ feedbacks }: AnalyticsChartProps) {
  const data = getPast7DaysData(feedbacks);

  return (
    <div className="rounded-2xl bg-[#181824]/90 border border-purple-500 shadow-xl p-2 w-full max-w-full flex items-center justify-center" style={{ minHeight: 260 }}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="6 6" stroke="#a259f7" opacity={0.18} />
          <XAxis dataKey="date" stroke="#e0d7ff" tick={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }} axisLine={{ stroke: '#a259f7' }} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#e0d7ff" tick={{ fontSize: 15, fontFamily: 'monospace' }} axisLine={{ stroke: '#a259f7' }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a259f7', strokeWidth: 2, opacity: 0.18 }} />
          <Line type="monotone" dataKey="score" stroke="#a259f7" strokeWidth={4} dot={{ r: 8, fill: '#a259f7', stroke: '#181824', strokeWidth: 2 }} activeDot={{ r: 12, fill: '#a259f7', stroke: '#fff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 