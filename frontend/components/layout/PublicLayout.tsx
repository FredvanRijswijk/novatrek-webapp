'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Plane } from 'lucide-react'
import { track } from '@vercel/analytics'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="rounded-lg"
                >
                  <rect width="96" height="96" fill="#1A272D"></rect>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M48.5 68.8082C60.2682 68.8082 69.8082 59.2682 69.8082 47.5C69.8082 35.7318 60.2682 26.1918 48.5 26.1918C36.7318 26.1918 27.1918 35.7318 27.1918 47.5C27.1918 59.2682 36.7318 68.8082 48.5 68.8082ZM48.5 78C65.3447 78 79 64.3447 79 47.5C79 30.6553 65.3447 17 48.5 17C31.6553 17 18 30.6553 18 47.5C18 64.3447 31.6553 78 48.5 78Z"
                    fill="white"
                  ></path>
                </svg>
                <span className="text-2xl font-bold">NovaTrek</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/about"
                className="text-sm font-medium hover:text-primary"
              >
                About
              </Link>
              <Link
                href="/marketplace"
                className="text-sm font-medium hover:text-primary"
              >
                Marketplace
              </Link>
              <Link
                href="/experts"
                className="text-sm font-medium hover:text-primary"
              >
                Experts
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium hover:text-primary"
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={() => {
                  track('click', { button: 'nav_sign_in', page: 'public' })
                  router.push("/login")
                }}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => {
                  track('click', { button: 'nav_get_started', page: 'public' })
                  router.push("/signup")
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-6 h-6 text-primary" />
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
                  <Link href="/investors" className="hover:text-primary">
                    Investors
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
            © 2024 NovaTrek. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}