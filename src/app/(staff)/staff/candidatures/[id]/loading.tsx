export default function CandidatureDetailLoading() {
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* Retour */}
        <div className="h-4 w-28 bg-bg-elevated rounded mb-8" />
        {/* Avatar + nom */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-bg-elevated rounded-full" />
          <div>
            <div className="h-7 w-40 bg-bg-elevated rounded mb-2" />
            <div className="h-4 w-24 bg-bg-elevated rounded" />
          </div>
        </div>
        <div className="h-px bg-bg-elevated mb-8" />
        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 bg-bg-elevated rounded" />
          <div className="h-32 bg-bg-elevated rounded" />
          <div className="h-48 bg-bg-elevated rounded sm:col-span-2" />
        </div>
      </div>
    </div>
  );
}
