export default function GuideDetailLoading() {
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* Retour */}
        <div className="h-4 w-20 bg-bg-elevated rounded mb-8" />
        {/* Badge + titre */}
        <div className="h-5 w-16 bg-bg-elevated rounded mb-3" />
        <div className="h-9 w-2/3 bg-bg-elevated rounded mb-2" />
        <div className="h-4 w-32 bg-bg-elevated rounded mb-6" />
        <div className="h-px bg-bg-elevated mb-8" />
        {/* Contenu */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-bg-elevated rounded" />
          <div className="h-4 w-5/6 bg-bg-elevated rounded" />
          <div className="h-4 w-4/6 bg-bg-elevated rounded" />
          <div className="h-4 w-full bg-bg-elevated rounded mt-4" />
          <div className="h-4 w-3/4 bg-bg-elevated rounded" />
        </div>
      </div>
    </div>
  );
}
