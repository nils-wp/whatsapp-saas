"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#features", label: "Produkt" },
  { href: "#pricing", label: "Preise" },
  { href: "#resources", label: "Ressourcen" },
]

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Chatsetter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="text-gray-300 hover:text-white">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/signup">Kostenlos starten</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-80 bg-slate-900 border-slate-800"
            >
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="text-lg text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-800">
                  <SheetClose asChild>
                    <Button variant="ghost" asChild className="justify-start text-gray-300">
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      <Link href="/signup">Kostenlos starten</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
