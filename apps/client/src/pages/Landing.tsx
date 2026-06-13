import { Link } from "react-router-dom";
import { branding } from "../config/branding";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Users,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Landmark,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    desc: "End-to-end encryption, 2FA, and row-level security on every piece of data. Your money never sleeps — and neither does our security.",
  },
  {
    icon: Zap,
    title: "Real-time everything",
    desc: "Instant balance updates, live transaction notifications, and WebSocket-powered alerts keep you in control the moment anything moves.",
  },
  {
    icon: Globe2,
    title: "Multi-currency & i18n",
    desc: "Operate in EUR, USD, GBP and more. Full French and English UI with locale-aware formatting out of the box.",
  },
  {
    icon: Users,
    title: "Tontines & group savings",
    desc: "The only fintech platform built for collective finance. Create rotating savings groups, invite members, and track every cycle automatically.",
  },
  {
    icon: TrendingUp,
    title: "Loan management",
    desc: "Apply for loans, simulate repayment schedules, and track approval status — all inside the same dashboard.",
  },
  {
    icon: CreditCard,
    title: "Smart card management",
    desc: "Issue and manage virtual and physical cards per account. Set limits, freeze instantly, copy details in one tap.",
  },
];

const STATS = [
  { value: "100%", label: "Audit trail coverage" },
  { value: "2FA", label: "TOTP authentication" },
  { value: "< 200ms", label: "API response time" },
  { value: "RLS", label: "Row-level security" },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for individuals managing personal accounts.",
    cta: "Get started free",
    href: "/register",
    highlight: false,
    features: [
      "1 checking + 1 savings account",
      "Up to 50 transactions/month",
      "KYC document upload",
      "Mobile-friendly dashboard",
    ],
  },
  {
    name: "Pro",
    price: "€9",
    period: "/month",
    desc: "For power users and small teams who need more.",
    cta: "Start free trial",
    href: "/register",
    highlight: true,
    features: [
      "Unlimited accounts & cards",
      "Tontines & group savings",
      "Loan requests & simulator",
      "Priority support",
      "PDF statements",
      "Multi-currency",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "White-label or dedicated deployment for your business.",
    cta: "Contact us",
    href: `mailto:${branding.supportEmail}`,
    highlight: false,
    features: [
      "Everything in Pro",
      "ADMIN & COMPLIANCE roles",
      "Audit log export (CSV/JSON)",
      "Custom domain & branding",
      "SLA & dedicated support",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: "Finally a platform that handles tontines natively. Our savings group of 12 people went fully digital in one afternoon.",
    author: "Marie K.",
    role: "Community organiser, Lyon",
  },
  {
    quote: "The admin panel gave our compliance team everything they need without buying a separate tool.",
    author: "Jean-Pierre M.",
    role: "CFO, fintech startup",
  },
  {
    quote: "2FA, audit logs, and real-time alerts. I didn't expect this level of security from an early-stage product.",
    author: "Aïcha D.",
    role: "Security consultant",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600 tracking-tight">{branding.appName}</span>
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition">Pricing</a>
            <a href="#testimonials" className="hover:text-gray-900 transition">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 text-center bg-gradient-to-b from-blue-50/60 to-white">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-6">
            <Landmark className="w-3.5 h-3.5" />
            Modern banking infrastructure
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
            Banking that works
            <br />
            <span className="text-blue-600">for everyone.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Accounts, loans, tontines, cards, and compliance — all in one platform.
            Built for individuals, communities, and the teams that serve them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Open your account — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-gray-500 font-medium hover:text-gray-900 transition"
            >
              See how it works <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl font-bold text-blue-600">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything your money needs
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              One platform. No integrations required.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 p-7 hover:shadow-md hover:border-blue-100 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Trusted by real people
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-gray-500">No hidden fees. No surprises. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col gap-6 ${
                  plan.highlight
                    ? "border-blue-500 shadow-xl shadow-blue-100 bg-blue-600 text-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.highlight ? "text-blue-200" : "text-blue-600"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-blue-500"}`} />
                      <span className={plan.highlight ? "text-blue-50" : "text-gray-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href.startsWith("mailto") ? plan.href : plan.href}
                  className={`text-center font-semibold py-3 rounded-xl transition text-sm ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
            Ready to take control of your finances?
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Join thousands of users who manage their accounts, savings groups, and loans in one place.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition shadow-xl text-lg"
          >
            Create your free account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white font-bold text-lg">{branding.appName}</span>
          <p className="text-sm">© {new Date().getFullYear()} {branding.appName}. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition">Sign in</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
