import Link from "next/link"
import { MessageSquare, Twitter, Linkedin, Github } from "lucide-react"

const footerLinks = {
  produkt: [
    { label: "Features", href: "#features" },
    { label: "Preise", href: "#pricing" },
    { label: "Integrationen", href: "#integrations" },
    { label: "API Dokumentation", href: "/docs" },
  ],
  ressourcen: [
    { label: "Blog", href: "/blog" },
    { label: "Hilfe-Center", href: "/help" },
    { label: "Tutorials", href: "/tutorials" },
    { label: "Webinare", href: "/webinars" },
  ],
  rechtliches: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "AGB", href: "/agb" },
    { label: "Cookie-Einstellungen", href: "#cookies" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/chatsetter", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/chatsetter", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/chatsetter", label: "GitHub" },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Chatsetter</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Die fuehrende WhatsApp-Automatisierungsplattform fuer deutsche Unternehmen.
              DSGVO-konform, sicher und skalierbar.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Produkt
            </h4>
            <ul className="space-y-3">
              {footerLinks.produkt.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Ressourcen
            </h4>
            <ul className="space-y-3">
              {footerLinks.ressourcen.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Rechtliches
            </h4>
            <ul className="space-y-3">
              {footerLinks.rechtliches.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Chatsetter GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Alle Systeme betriebsbereit</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
