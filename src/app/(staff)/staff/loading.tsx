export default function StaffLoading() {
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* Faux header */}
        <div className="h-3 w-24 bg-bg-elevated rounded mb-3" />
        <div className="h-8 w-52 bg-bg-elevated rounded mb-2" />
        <div className="h-3 w-28 bg-bg-elevated rounded mb-6" />
        <div className="h-px bg-bg-elevated mb-8" />
        {/* Faux liste */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-bg-elevated rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
