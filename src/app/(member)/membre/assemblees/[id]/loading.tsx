export default function AssemblyDetailLoading() {
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        {/* Retour */}
        <div className="h-4 w-20 bg-bg-elevated rounded mb-8" />
        {/* Badge + titre */}
        <div className="h-5 w-24 bg-bg-elevated rounded mb-3" />
        <div className="h-9 w-3/4 bg-bg-elevated rounded mb-2" />
        <div className="h-4 w-28 bg-bg-elevated rounded mb-6" />
        <div className="h-px bg-bg-elevated mb-8" />
        {/* Vidéo placeholder */}
        <div className="h-48 w-full bg-bg-elevated rounded mb-8" />
        {/* Compte-rendu */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-bg-elevated rounded" />
          <div className="h-4 w-5/6 bg-bg-elevated rounded" />
          <div className="h-4 w-4/6 bg-bg-elevated rounded" />
        </div>
      </div>
    </div>
  );
}
