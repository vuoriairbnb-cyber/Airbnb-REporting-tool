import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{DISCLAIMER_TEXT}</p>
          <Button asChild className="w-full">
            <Link href="/app/dashboard">Accept and preview app</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
