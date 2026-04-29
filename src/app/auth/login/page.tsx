import { redirect } from 'next/navigation';

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

function getSafeCallbackUrl(callbackUrl: string | string[] | undefined) {
  const value = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  redirect(getSafeCallbackUrl(params?.callbackUrl));
}
