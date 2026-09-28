import { signupsPaused } from "@/lib/stripe";
import SignupsPaused from "./SignupsPaused";

// While live payments are unavailable (see signupsPaused()), every /signup
// route shows the waitlist notice instead of the wizard, whose checkout could
// only end on the payment provider's error page.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  if (signupsPaused()) return <SignupsPaused />;
  return children;
}
