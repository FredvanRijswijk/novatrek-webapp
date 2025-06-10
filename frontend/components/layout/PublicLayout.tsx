"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plane, 
  Menu, 
  X, 
  Info, 
  Store, 
  Users, 
  DollarSign, 
  Euro,
  Mail,
  LogIn,
  Rocket
} from "lucide-react";
import { track } from "@vercel/analytics";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/about", label: "About", icon: Info },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/experts", label: "Experts", icon: Users },
    { href: "/pricing", label: "Pricing", icon: Euro },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-lg md:w-12 md:h-12"
                >
                  <rect width="96" height="96" fill="#000000"></rect>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M48.5 68.8082C60.2682 68.8082 69.8082 59.2682 69.8082 47.5C69.8082 35.7318 60.2682 26.1918 48.5 26.1918C36.7318 26.1918 27.1918 35.7318 27.1918 47.5C27.1918 59.2682 36.7318 68.8082 48.5 68.8082ZM48.5 78C65.3447 78 79 64.3447 79 47.5C79 30.6553 65.3447 17 48.5 17C31.6553 17 18 30.6553 18 47.5C18 64.3447 31.6553 78 48.5 78Z"
                    fill="white"
                  ></path>
                </svg>
                <span className="text-xl md:text-2xl font-bold">NovaTrek</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                onClick={() => {
                  track("click", { button: "nav_sign_in", page: "public" });
                  router.push("/login");
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  track("click", { button: "nav_get_started", page: "public" });
                  router.push("/signup");
                }}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0">
                  <SheetHeader className="border-b p-6">
                    <div className="flex items-center gap-3">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 96 96"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="rounded-lg"
                      >
                        <rect width="96" height="96" fill="#000000"></rect>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M48.5 68.8082C60.2682 68.8082 69.8082 59.2682 69.8082 47.5C69.8082 35.7318 60.2682 26.1918 48.5 26.1918C36.7318 26.1918 27.1918 35.7318 27.1918 47.5C27.1918 59.2682 36.7318 68.8082 48.5 68.8082ZM48.5 78C65.3447 78 79 64.3447 79 47.5C79 30.6553 65.3447 17 48.5 17C31.6553 17 18 30.6553 18 47.5C18 64.3447 31.6553 78 48.5 78Z"
                          fill="white"
                        ></path>
                      </svg>
                      <SheetTitle className="text-2xl font-bold">NovaTrek</SheetTitle>
                    </div>
                  </SheetHeader>
                  
                  <div className="flex-1 flex flex-col px-6">
                    {/* Navigation Links */}
                    <nav className="flex-1 py-6">
                      <div className="space-y-1">
                        {navLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-center gap-3 text-lg font-medium hover:text-primary hover:bg-accent rounded-lg px-4 py-3 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon className="h-5 w-5" />
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    </nav>

                    {/* Theme Toggle */}
                    <div className="border-t py-4">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                        <span className="text-lg font-medium">Dark Mode</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    {/* Auth Buttons */}
                    <div className="border-t pt-6 pb-6 space-y-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full justify-center gap-2"
                        onClick={() => {
                          track("click", { button: "mobile_sign_in", page: "public" });
                          router.push("/login");
                          setIsOpen(false);
                        }}
                      >
                        <LogIn className="h-5 w-5" />
                        Sign In
                      </Button>
                      <Button
                        size="lg"
                        className="w-full justify-center gap-2"
                        onClick={() => {
                          track("click", { button: "mobile_get_started", page: "public" });
                          router.push("/signup");
                          setIsOpen(false);
                        }}
                      >
                        <Rocket className="h-5 w-5" />
                        Get Started
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded"
                >
                  <rect width="96" height="96" fill="#000000"></rect>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M48.5 68.8082C60.2682 68.8082 69.8082 59.2682 69.8082 47.5C69.8082 35.7318 60.2682 26.1918 48.5 26.1918C36.7318 26.1918 27.1918 35.7318 27.1918 47.5C27.1918 59.2682 36.7318 68.8082 48.5 68.8082ZM48.5 78C65.3447 78 79 64.3447 79 47.5C79 30.6553 65.3447 17 48.5 17C31.6553 17 18 30.6553 18 47.5C18 64.3447 31.6553 78 48.5 78Z"
                    fill="white"
                  ></path>
                </svg>
                <span className="text-lg font-bold">NovaTrek</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered travel planning for the modern explorer.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/#features" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-primary">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/experts" className="hover:text-primary">
                    Find Experts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-primary">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} NovaTrek. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
