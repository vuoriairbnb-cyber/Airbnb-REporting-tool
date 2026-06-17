import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Supabase Auth wiring comes in the next implementation slice.
          </p>
          <Button asChild className="w-full">
            <Link href="/app/dashboard">Continue to app preview</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account? <Link href="/signup" className="text-primary">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
