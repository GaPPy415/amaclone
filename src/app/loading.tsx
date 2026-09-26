export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse flex flex-col gap-8">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="aspect-square w-full bg-muted rounded-lg"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
