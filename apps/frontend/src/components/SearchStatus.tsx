interface SearchStatusProps {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  noRoutesMessage?: string;
}

export function SearchStatus({
  errorMessage,
  isError,
  isLoading,
  noRoutesMessage
}: SearchStatusProps) {
  if (isLoading) {
    return (
      <section
        className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft"
        aria-live="polite"
      >
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 animate-pulse rounded-full bg-transit-teal" />
          <div>
            <p className="text-lg font-bold text-transit-blue">Finding routes</p>
            <p className="mt-1 text-readable text-transit-muted">
              Checking available transit options now.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-soft"
        aria-live="polite"
      >
        <p className="text-lg font-bold text-red-800">We could not load routes.</p>
        <p className="mt-1 text-readable text-red-900">
          {errorMessage ??
            "Check the locations and try again. If this keeps happening, wait a moment and search again."}
        </p>
      </section>
    );
  }

  if (noRoutesMessage) {
    return (
      <section
        className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft"
        aria-live="polite"
      >
        <p className="text-lg font-bold text-transit-blue">No route available</p>
        <p className="mt-1 text-readable text-transit-muted">{noRoutesMessage}</p>
        <p className="mt-3 text-readable text-transit-muted">
          Try a nearby station, a broader destination name, or a different travel time.
        </p>
      </section>
    );
  }

  return null;
}
