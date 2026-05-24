interface DayBar {
  lovelace: number;
  paise: number;
  count: number;
}

interface DayEntry extends DayBar {
  date: string;
}

interface RevenueChartProps {
  data: Record<string, DayBar>;
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const days: DayEntry[] = Object.entries(data).map(([date, v]) => ({ date, ...v }));
  const maxLovelace = Math.max(...days.map((d) => d.lovelace), 1);

  const totalAda = days.reduce((s, d) => s + d.lovelace, 0) / 1_000_000;
  const totalOrders = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-text-secondary">7-Day Revenue</h2>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-teal-400">{totalAda.toFixed(2)} ADA</p>
          <p className="text-text-muted text-xs">{totalOrders} orders</p>
        </div>
      </div>

      {/* Bar chart — staggered grow-up animation */}
      <div className="flex items-end gap-1.5 h-20 mt-4">
        {days.map((day, idx) => {
          const heightPct = maxLovelace > 0 ? (day.lovelace / maxLovelace) * 100 : 0;
          const hasData = day.lovelace > 0;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full flex items-end justify-center overflow-hidden rounded-t-sm"
                style={{ height: '64px' }}
              >
                <div
                  className={`w-full rounded-t-sm ${
                    hasData
                      ? 'bg-gradient-to-t from-teal-700 to-teal-400 animate-grow-up'
                      : 'bg-surface-elevated'
                  }`}
                  style={{
                    height: hasData ? `${Math.max(heightPct, 8)}%` : '4px',
                    minHeight: hasData ? '6px' : '4px',
                    animationDelay: hasData ? `${idx * 60}ms` : '0ms',
                    animationFillMode: 'both',
                  }}
                  title={
                    hasData
                      ? `${(day.lovelace / 1_000_000).toFixed(2)} ADA · ${day.count} order${day.count !== 1 ? 's' : ''}`
                      : 'No revenue'
                  }
                />
              </div>
              <span className="text-text-muted text-[9px]">{shortDay(day.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
