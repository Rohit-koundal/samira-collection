export default function StatsChart({ title = 'Revenue Overview' }) {
  const points = [38, 58, 45, 75, 64, 88, 72, 94];
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-6 flex h-52 items-end gap-3">
        {points.map((point, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-xl bg-gradient-to-t from-wine to-rose" style={{ height: `${point}%` }} />
            <span className="text-[10px] font-black text-slate-400">M{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
