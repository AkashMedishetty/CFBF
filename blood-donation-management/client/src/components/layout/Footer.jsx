import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  MessageSquare
} from 'lucide-react';
import FloatingDock from '../ui/FloatingDock';

// Inline WhatsApp icon to avoid external dependency issues
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0012 0C5.38 0 .02 5.36.02 12A11.86 11.86 0 002 18.64L.13 23.87a.75.75 0 00.94.95l5.36-1.83A11.9 11.9 0 0012 24c6.62 0 12-5.36 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22.5a10.46 10.46 0 01-5.33-1.47.75.75 0 00-.6-.06l-4.39 1.5 1.5-4.39a.75.75 0 00-.06-.6A10.47 10.47 0 011.5 12C1.5 6.19 6.19 1.5 12 1.5S22.5 6.19 22.5 12 17.81 22.5 12 22.5z"/>
    <path d="M17.46 14.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.24-.25-.6-.5-.52-.68-.53-.18-.01-.38-.01-.58-.01s-.53.08-.8.38c-.27.3-1.05 1.03-1.05 2.52 0 1.48 1.07 2.92 1.22 3.12.15.2 2.1 3.21 5.08 4.5.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.08-.13-.27-.2-.57-.35z"/>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Quick Links': [
      { name: 'Home', href: '/' },
      { name: 'About Us', href: '/about' }
    ],
    'Support': [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/callforblood.cs' },
    { name: 'Twitter', icon: Twitter, href: 'https://www.twitter.com/callforblood_cs' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/callforbloodfoundation' },
    { name: 'WhatsApp', icon: WhatsAppIcon, href: 'https://wa.me/919491254120' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <img src="/Logo/android-chrome-192x192.png" alt="Callforblood Logo" className="h-6 w-6" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-slate-200">Callforblood</span>
                <span className="text-xl font-bold text-red-400">Foundation</span>
              </div>
            </div>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Connecting blood donors and recipients through intelligent automation, 
              real-time communication, and comprehensive data management to save lives.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-primary-400" />
                <span className="text-slate-300">info@callforbloodfoundation.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span className="text-slate-300">Nationwide Service, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks['Quick Links'].map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks['Support'].map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          
        </div>

        {/* Associations - centered above red banner */}
        <div className="mt-10">
          <div className="max-w-4xl mx-auto bg-white rounded-xl p-6 shadow-md">
            <p className="text-slate-800 text-sm font-semibold mb-3 text-center">In association with</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 items-start justify-items-center">
              <div className="flex flex-col items-center">
                <img src="/WSO-Logo.jpg" alt="WSO - We Shall Overcome, Hyderabad" className="h-[72px] w-auto object-contain" />
                <span className="text-slate-700 text-xs mt-2 text-center">WSO - We Shall Overcome, Hyderabad</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/AD11.png" alt="AD11 Sports Hyderabad" className="h-20 w-auto object-contain" />
                <span className="text-slate-700 text-xs mt-2 text-center">AD11 Sports Hyderabad</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/Maagulf-Logo.png" alt="Maa Gulf News, Dubai" className="h-16 w-auto object-contain" />
                <span className="text-slate-700 text-xs mt-2 text-center">Maa Gulf News, Dubai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy-focused banner */}
        <div className="mt-12 p-6 bg-primary-600 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Join India's First Privacy-Protected Platform</h3>
              <p className="text-primary-100">
                Register as a donor with complete privacy protection and 3-month hiding after donation.
              </p>
            </div>
            <Link
              to="/register"
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-200"
            >
              Register as Donor
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © {currentYear} Callforblood Foundation. All rights reserved.
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              {/* Social links */}
              <div className="flex items-center space-x-4">
                <span className="text-slate-400 text-sm mr-2">Follow us:</span>
                <FloatingDock
                  items={socialLinks.map(({ name, href, icon: Icon }) => ({
                    title: name,
                    href,
                    icon: <Icon className="h-full w-full" />
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating dock */}
      <div className="fixed bottom-4 right-4 md:hidden z-40">
        <FloatingDock
          items={socialLinks.map(({ name, href, icon: Icon }) => ({
            title: name,
            href,
            icon: <Icon className="h-full w-full" />
          }))}
        />
      </div>
    </footer>
  );
};

export default Footer;