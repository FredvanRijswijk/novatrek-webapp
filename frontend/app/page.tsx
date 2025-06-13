"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Plane,
  MapPin,
  Sparkles,
  Check,
  Store,
  Users,
  Star,
  MessageSquare,
  Calendar,
  Euro,
  Globe,
  Shield,
  Zap,
  Brain,
  Share2,
  Camera,
  Cloud,
  Mail,
  ChevronRight,
  ArrowRight,
  Inbox,
  Package,
  UserCheck,
  BarChart3,
  Sun,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Trip Planning",
    description:
      "Get personalized itineraries powered by GPT-4 and Gemini. Our AI understands your preferences and creates perfect day-by-day plans.",
  },
  {
    icon: Users,
    title: "Group Travel Made Easy",
    description:
      "Plan trips with friends and family. Our AI finds the perfect compromise between everyone's preferences.",
  },
  {
    icon: Store,
    title: "Expert Marketplace",
    description:
      "Connect with verified travel experts. Get custom itineraries, consultations, and insider tips from professionals.",
  },
  {
    icon: Inbox,
    title: "Travel Inbox",
    description:
      "Save travel inspiration from anywhere on the web. Our browser extension and email integration capture everything.",
  },
  {
    icon: Euro,
    title: "Smart Budget Tracking",
    description:
      "Track expenses by category, split costs with travel companions, and stay within budget with real-time insights.",
  },
  {
    icon: Sun,
    title: "Weather-Aware Planning",
    description:
      "Get real-time weather forecasts and AI recommendations that adapt to conditions at your destination.",
  },
];

const expertFeatures = [
  {
    icon: Package,
    title: "Sell Your Expertise",
    description:
      "Create and sell trip templates, offer consultations, or provide custom planning services.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "Stripe Connect handles all payments securely. Get paid directly with only 15% platform fee.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track your sales, customer reviews, and earnings with detailed analytics and insights.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: formatPrice(0),
    description: "Perfect for casual travelers",
    features: [
      "1 active trip",
      "Basic AI recommendations",
      "3-day itineraries",
      "Standard support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: formatPrice(9.99),
    period: "/month",
    description: "For regular travelers",
    features: [
      "3 active trips",
      "Advanced AI features",
      "7-day itineraries",
      "Priority support",
      "Weather integration",
      "Budget tracking",
    ],
    cta: "Start Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: formatPrice(29.99),
    period: "/month",
    description: "For travel enthusiasts",
    features: [
      "Unlimited trips",
      "Premium AI models",
      "14-day itineraries",
      "24/7 priority support",
      "Group travel tools",
      "API access",
      "Custom integrations",
    ],
    cta: "Start Trial",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Nomad",
    content:
      "NovaTrek's AI saved me hours of planning. The group compromise feature helped my friends and I plan the perfect trip to Japan!",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Travel Expert",
    content:
      "As a travel planner, the marketplace has been game-changing. I've connected with clients worldwide and grown my business 3x.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Adventure Traveler",
    content:
      "The Travel Inbox is brilliant! I save inspiration from Instagram, blogs, and emails all in one place. Planning has never been easier.",
    rating: 5,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    track("click", { button: "hero_email_cta", page: "homepage", has_email: !!email });
    if (email) {
      router.push(`/waitlist?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/waitlist");
    }
  };

  return (
    <PublicLayout>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              AI-Powered Travel Planning Platform
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Plan Smarter,
            <br />
            Travel Better
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto px-4">
            NovaTrek combines AI intelligence with human expertise to create
            personalized travel experiences. From planning to booking to sharing
            memories, we've got you covered.
          </p>

          {/* Email CTA */}
          <form onSubmit={handleGetStarted} className="max-w-md mx-auto mb-8 px-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="lg" className="h-11">
                Start Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free forever plan available
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold">10,000+</div>
              <div className="text-sm text-muted-foreground">
                Active Travelers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">
                Travel Experts
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need for Perfect Trips
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features that make travel planning effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat Demo */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Chat with the Smartest Travel AI
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our AI assistant understands context, remembers your
                preferences, and provides personalized recommendations using
                GPT-4 and Gemini models.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">
                      Multi-destination planning
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Plan complex trips with multiple stops effortlessly
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">Real-time recommendations</div>
                    <div className="text-sm text-muted-foreground">
                      Get instant suggestions based on weather and local events
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">Budget optimization</div>
                    <div className="text-sm text-muted-foreground">
                      AI helps you get the most value within your budget
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-8"
                onClick={() => {
                  track("click", { button: "try_ai_chat_free", page: "homepage" });
                  router.push("/waitlist");
                }}
              >
                Join Waitlist
                <MessageSquare className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-muted rounded-lg p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 ml-auto max-w-xs">
                    <p className="text-sm">
                      I'm planning a 10-day trip to Japan for cherry blossom
                      season. What do you recommend?
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 max-w-xs">
                    <p className="text-sm">
                      Great timing! For cherry blossoms, I recommend visiting in
                      early April. Here's a perfect itinerary: 🌸 Days 1-3:
                      Tokyo (Ueno Park, Shinjuku Gyoen) 🌸 Days 4-5: Mount Fuji
                      & Hakone 🌸 Days 6-8: Kyoto (Maruyama Park, Philosopher's
                      Path) 🌸 Days 9-10: Osaka (Osaka Castle Park) Would you
                      like me to add specific activities and budget estimates?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Travel Expert Marketplace
            </h2>
            <p className="text-xl text-muted-foreground">
              Connect with professionals or become an expert yourself
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Travelers */}
            <Card className="p-8">
              <CardHeader>
                <Globe className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">For Travelers</CardTitle>
                <CardDescription>
                  Get expert help for your trips
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">Curated trip templates</div>
                    <div className="text-sm text-muted-foreground">
                      Ready-made itineraries by destination experts
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">1-on-1 consultations</div>
                    <div className="text-sm text-muted-foreground">
                      Video calls with travel professionals
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium">Custom planning</div>
                    <div className="text-sm text-muted-foreground">
                      Fully personalized trip planning services
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full mt-6"
                  variant="outline"
                  onClick={() => {
                    track("click", { button: "browse_marketplace", page: "homepage" });
                    router.push("/marketplace");
                  }}
                >
                  Browse Marketplace
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* For Experts */}
            <Card className="p-8 border-primary">
              <CardHeader>
                <UserCheck className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">For Travel Experts</CardTitle>
                <CardDescription>
                  Monetize your travel knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {expertFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <feature.icon className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full mt-6"
                  onClick={() => {
                    track("click", { button: "become_expert", page: "homepage" });
                    router.push("/dashboard/become-expert");
                  }}
                >
                  Become an Expert
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Travel Inbox Feature */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Inbox className="w-12 h-12 text-primary mb-6" />
                <h2 className="text-3xl font-bold mb-4">Your Travel Inbox</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Never lose travel inspiration again. Save content from
                  anywhere - websites, emails, or social media - and our AI
                  organizes everything for you.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <span>Browser extension for one-click saves</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span>Email forwarding to your inbox</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <span>AI categorization and insights</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-background rounded-lg shadow-xl p-6 max-w-sm">
                  <div className="text-sm font-medium text-muted-foreground mb-4">
                    Travel Inbox
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="font-medium text-sm">
                        Hidden Cafe in Tokyo
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Saved from Instagram • 2 hours ago
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="font-medium text-sm">
                        Best Hiking Trails in Peru
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Saved from Blog • Yesterday
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="font-medium text-sm">
                        Barcelona Food Tour
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Saved via Email • 3 days ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Choose the plan that fits your travel style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={plan.highlighted ? "border-primary shadow-lg" : ""}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => {
                      track("click", { 
                        button: "pricing_cta", 
                        page: "homepage", 
                        plan: plan.name.toLowerCase(),
                        price: plan.price
                      });
                      router.push("/signup");
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Loved by Travelers Worldwide
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              See what our community has to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            Ready to Transform Your Travel Experience?
          </h2>
          <p className="text-base md:text-xl mb-8 opacity-90">
            Join thousands of travelers who plan smarter with NovaTrek
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                track("click", { button: "footer_start_free_trial", page: "homepage" });
                router.push("/signup");
              }}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
              onClick={() => {
                track("click", { button: "footer_become_expert", page: "homepage" });
                router.push("/dashboard/become-expert");
              }}
            >
              Become an Expert
              <UserCheck className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
