export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-48 overflow-hidden rounded-full bg-paper-raised">
          <div className="h-full w-1/3 animate-pulse bg-brand" />
        </div>
      </div>
    </main>
  );
}
