import { LoadingState } from "@/components/state/LoadingState";

export default function AppLoading() {
  return (
    <LoadingState
      variant="page"
      label="Loading workspace..."
      description="Preparing your reporting preparation workspace."
    />
  );
}
