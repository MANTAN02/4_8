import { Link } from "wouter";
import { Coins, Heart, MapPin, Mail, Phone, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-baartal-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Coins className="h-8 w-8 text-baartal-orange mr-2" />
              <span className="text-2xl font-bold">Baartal</span>
            </div>
            <p className="text-blue-100 mb-4 text-sm">
              Mumbai's first hyperlocal barter and loyalty platform connecting 
              local businesses through curated bundles and B-Coins.
            </p>
            <div className="flex items-center text-blue-100 text-sm">
              <Heart className="h-4 w-4 mr-2 text-baartal-orange" />
              Made with love in Mumbai
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/about" className="hover:text-baartal-orange transition-colors">
                  About Baartal
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-baartal-orange transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-baartal-orange transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-baartal-orange transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Users</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/customer-login" className="hover:text-baartal-orange transition-colors">
                  Customer Login
                </Link>
              </li>
              <li>
                <Link href="/business-login" className="hover:text-baartal-orange transition-colors">
                  Business Login
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-baartal-orange transition-colors">
                  Download App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-baartal-orange transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
            <div className="space-y-3 text-sm text-blue-100">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-baartal-orange" />
                hello@baartal.com
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-baartal-orange" />
                +91 XXXXX-XXXXX
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-baartal-orange" />
                Mumbai, Maharashtra
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Follow Us</h4>
              <div className="flex space-x-3">
                <a href="#" className="text-blue-100 hover:text-baartal-orange transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-blue-100 hover:text-baartal-orange transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-blue-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-blue-100">
            <div className="mb-4 md:mb-0">
              © 2024 Baartal Technologies Pvt. Ltd. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-baartal-orange transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-baartal-orange transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-baartal-orange transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}