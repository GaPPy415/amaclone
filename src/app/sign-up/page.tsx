import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  );
}
