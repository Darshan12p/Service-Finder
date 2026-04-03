import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  const linkClass = "hover:text-indigo-600 transition";

  return (
    <footer className="relative overflow-hidden border-t bg-gradient-to-br from-indigo-100">
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100/40 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              <span className="text-indigo-600">Service</span> Finder
            </h2>
            <p className="text-gray-600 mt-3 leading-7">
              Trusted platform for verified doorstep services with fast booking
              and professional support.
            </p>

            <button
              onClick={() => navigate("/contact")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow"
            >
              Contact Support <ArrowUpRight size={16} />
            </button>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg">Company</h3>
            <ul className="text-gray-600 space-y-3 mt-4">
              <li>
                <Link className={linkClass} to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/privacy-policy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/careers">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg">For Customers</h3>
            <ul className="text-gray-600 space-y-3 mt-4">
              <li>
                <Link className={linkClass} to="/reviews">
                  Reviews
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/categories">
                  Categories
                </Link>
              </li>
              <li>
                <Link className={linkClass} to="/blogs">
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg">Contact</h3>
            <div className="mt-4 space-y-3 text-gray-600">
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-indigo-600" />
                support@servicefinder.com
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-600" />
                Mon–Sat, 9 AM – 7 PM
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" />
                Ahmedabad, Gujarat, India
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Service Finder. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Made with care for better services
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;