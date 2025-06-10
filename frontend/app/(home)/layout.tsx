import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-Powered Travel Planning & Itinerary Builder",
  description: "Create your perfect trip with NovaTrek's AI travel planner. Get personalized recommendations, build custom itineraries, and connect with travel experts for any destination worldwide.",
  openGraph: {
    title: "NovaTrek - AI-Powered Travel Planning & Itinerary Builder",
    description: "Create your perfect trip with NovaTrek's AI travel planner. Get personalized recommendations, build custom itineraries, and connect with travel experts.",
    type: "website",
    images: [
      {
        url: "/api/og?title=Plan%20Your%20Perfect%20Trip%20with%20AI&description=Create%20personalized%20itineraries%20for%20any%20destination&theme=bw",
        width: 1200,
        height: 630,
        alt: "NovaTrek - Plan Your Perfect Trip with AI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NovaTrek - AI-Powered Travel Planning",
    description: "Create your perfect trip with AI-powered recommendations and expert advice.",
    images: ["/api/og?title=Plan%20Your%20Perfect%20Trip%20with%20AI&description=Create%20personalized%20itineraries%20for%20any%20destination&theme=bw"]
  }
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}