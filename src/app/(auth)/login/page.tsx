import { AuthForm } from "@/components/auth/AuthForm";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <AuthForm mode="login" next={params.next} />;
}
