import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Lock,
  Award,
  Globe,
  ArrowUpRight,
  Star,
} from "lucide-react";

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Zap,
      title: t("landing.features.speed.title", "Lightning Fast"),
      description: t(
        "landing.features.speed.description",
        "Instant transactions and real-time balance updates"
      ),
    },
    {
      icon: Shield,
      title: t("landing.features.security.title", "Bank-Grade Security"),
      description: t(
        "landing.features.security.description",
        "AES-256 encryption and multi-factor authentication"
      ),
    },
    {
      icon: Users,
      title: t("landing.features.collaborative.title", "Collaborative Groups"),
      description: t(
        "landing.features.collaborative.description",
        "Create and manage tontines with ease"
      ),
    },
    {
      icon: TrendingUp,
      title: t("landing.features.analytics.title", "Smart Analytics"),
      description: t(
        "landing.features.analytics.description",
        "Track your savings and investments in real time"
      ),
    },
    {
      icon: Lock,
      title: t("landing.features.compliance.title", "Fully Compliant"),
      description: t(
        "landing.features.compliance.description",
        "GDPR, PCI-DSS, and regulatory standards"
      ),
    },
    {
      icon: Globe,
      title: t("landing.features.global.title", "Global Reach"),
      description: t(
        "landing.features.global.description",
        "Support for multiple currencies and payment methods"
      ),
    },
  ];

  const pricingPlans = [
    {
      name: t("landing.pricing.basic.name", "Starter"),
      price: t("landing.pricing.basic.price", "Free"),
      description: t(
        "landing.pricing.basic.description",
        "Perfect for individual users"
      ),
      features: [
        t("landing.pricing.basic.feature1", "Up to 3 tontines"),
        t("landing.pricing.basic.feature2", "Basic analytics"),
        t("landing.pricing.basic.feature3", "Email support"),
        t("landing.pricing.basic.feature4", "Standard security"),
      ],
      highlighted: false,
    },
    {
      name: t("landing.pricing.pro.name", "Professional"),
      price: t("landing.pricing.pro.price", "$9.99"),
      period: t("landing.pricing.pro.period", "/month"),
      description: t(
        "landing.pricing.pro.description",
        "For power users and small groups"
      ),
      features: [
        t("landing.pricing.pro.feature1", "Unlimited tontines"),
        t("landing.pricing.pro.feature2", "Advanced analytics"),
        t("landing.pricing.pro.feature3", "Priority support"),
        t("landing.pricing.pro.feature4", "Custom branding"),
        t("landing.pricing.pro.feature5", "API access"),
      ],
      highlighted: true,
    },
    {
      name: t("landing.pricing.enterprise.name", "Enterprise"),
      price: t("landing.pricing.enterprise.price", "Custom"),
      description: t(
        "landing.pricing.enterprise.description",
        "For organizations and teams"
      ),
      features: [
        t("landing.pricing.enterprise.feature1", "Everything in Pro"),
        t("landing.pricing.enterprise.feature2", "Dedicated support"),
        t("landing.pricing.enterprise.feature3", "Custom integrations"),
        t("landing.pricing.enterprise.feature4", "SLA guarantees"),
        t("landing.pricing.enterprise.feature5", "White-label options"),
      ],
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      author: t("landing.testimonials.user1.author", "Amara Diallo"),
      role: t("landing.testimonials.user1.role", "Entrepreneur"),
      location: t("landing.testimonials.user1.location", "Dakar, Senegal"),
      text: t(
        "landing.testimonials.user1.text",
        "Bolter has completely transformed how our tontine group manages finances. It's secure, easy to use, and transparent."
      ),
      avatar: "👩‍💼",
      rating: 5,
    },
    {
      author: t("landing.testimonials.user2.author", "Kofi Mensah"),
      role: t("landing.testimonials.user2.role", "Small Business Owner"),
      location: t("landing.testimonials.user2.location", "Accra, Ghana"),
      text: t(
        "landing.testimonials.user2.text",
        "The best platform for managing group savings. Customer support is exceptional."
      ),
      avatar: "👨‍💼",
      rating: 5,
    },
    {
      author: t("landing.testimonials.user3.author", "Zainab Hassan"),
      role: t("landing.testimonials.user3.role", "Community Leader"),
      location: t("landing.testimonials.user3.location", "Lagos, Nigeria"),
      text: t(
        "landing.testimonials.user3.text",
        "Bolter makes it so easy to coordinate contributions and payouts. Our members love it!"
      ),
      avatar: "👩‍🦱",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-white font-bold text-xl">Bolter</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-700/50 transition"
              >
                {t("landing.nav.login", "Sign In")}
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
              >
                {t("landing.nav.signup", "Get Started")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1">
                  <span className="text-blue-400 text-sm font-medium">
                    {t("landing.hero.badge", "🚀 Now Live")}
                  </span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {t(
                    "landing.hero.title",
                    "Secure Banking for Your Community"
                  )}
                </h1>
                <p className="text-xl text-slate-300">
                  {t(
                    "landing.hero.subtitle",
                    "Manage group savings, investments, and tontines with bank-grade security and real-time transparency"
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {t("landing.hero.cta1", "Start Free Trial")}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById("features");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="border border-slate-600 hover:border-slate-400 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  {t("landing.hero.cta2", "Learn More")}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-sm text-slate-400">
                    {t("landing.hero.stat1", "Active Users")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">$50M+</div>
                  <div className="text-sm text-slate-400">
                    {t("landing.hero.stat2", "Managed")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-slate-400">
                    {t("landing.hero.stat3", "Uptime")}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 hidden lg:flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-20 blur-3xl" />
              <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full">
                <div className="space-y-4">
                  <div className="h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg" />
                  <div className="h-8 bg-slate-700/50 rounded" />
                  <div className="h-8 bg-slate-700/50 rounded w-3/4" />
                  <div className="pt-4 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-6 bg-blue-500/20 rounded px-2 flex items-center text-xs text-blue-300">
                        Secure
                      </div>
                      <div className="h-6 bg-green-500/20 rounded px-2 flex items-center text-xs text-green-300">
                        Active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              {t("landing.features.title", "Powerful Features")}
            </h2>
            <p className="text-xl text-slate-400">
              {t(
                "landing.features.subtitle",
                "Everything you need for secure group banking"
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 hover:border-blue-500/50 transition group"
                >
                  <Icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              {t("landing.pricing.title", "Simple Pricing")}
            </h2>
            <p className="text-xl text-slate-400">
              {t(
                "landing.pricing.subtitle",
                "Choose the plan that fits your needs"
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 transition ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 border-0 lg:scale-105 shadow-2xl"
                    : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-4">
                    <Award className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold text-white">
                      {t("landing.pricing.popular", "Most Popular")}
                    </span>
                  </div>
                )}
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    plan.highlighted ? "text-white" : "text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mb-6 ${
                    plan.highlighted ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-white" : "text-white"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`${
                        plan.highlighted ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate("/register")}
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  {t("landing.pricing.cta", "Get Started")}
                </button>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <ArrowUpRight
                        className={`w-5 h-5 ${
                          plan.highlighted
                            ? "text-white"
                            : "text-blue-400"
                        }`}
                      />
                      <span
                        className={`${
                          plan.highlighted ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              {t("landing.testimonials.title", "What Users Say")}
            </h2>
            <p className="text-xl text-slate-400">
              {t(
                "landing.testimonials.subtitle",
                "Join thousands of satisfied users across Africa"
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 hover:border-blue-500/50 transition"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                    <p className="text-xs text-slate-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            {t("landing.cta.title", "Ready to Get Started?")}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t(
              "landing.cta.subtitle",
              "Join our community and start managing your finances securely"
            )}
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2 mx-auto"
          >
            {t("landing.cta.button", "Create Free Account")}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-white font-bold">Bolter</span>
              </div>
              <p className="text-slate-400 text-sm">
                {t(
                  "landing.footer.description",
                  "Secure banking for communities"
                )}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("landing.footer.product", "Product")}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.features", "Features")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.pricing", "Pricing")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("landing.footer.company", "Company")}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.about", "About")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.contact", "Contact")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("landing.footer.legal", "Legal")}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.privacy", "Privacy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {t("landing.footer.terms", "Terms")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 Bolter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
