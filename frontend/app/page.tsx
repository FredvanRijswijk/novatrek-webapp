import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Next.js 15 + Tailwind CSS v4 + shadcn/ui
        </h1>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-center text-muted-foreground mb-4">
            Your stack is ready! This setup includes:
          </p>
          
          <ul className="list-disc list-inside text-left space-y-2 mb-8">
            <li>Next.js 15 with App Router</li>
            <li>TypeScript for type safety</li>
            <li>Tailwind CSS v4 (alpha)</li>
            <li>shadcn/ui components</li>
            <li>React 19 compatibility</li>
          </ul>
          
          <div className="flex gap-4 flex-wrap justify-center">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          
          <div className="flex gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </div>
    </main>
  )
}