import { LoadingState } from "@/components/state/LoadingState";

export default function Loading() {
  return (
    <main className="p-4">
      <LoadingState label="Loading HostReport" />
    </main>
  );
}
