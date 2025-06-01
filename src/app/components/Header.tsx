import React from "react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent py-4" role="banner">
      <div className="mx-auto w-full max-w-7xl">
        <div className="bg-white/50 backdrop-blur-md border border-gray-400 rounded-xl h-[56px] px-4 flex items-center shadow-md">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="#home"
              className="text-xl font-bold tracking-tight font-reckless flex flex-row gap-2 items-center text-center"
            >
              <Image
                src="/static/gitprooflogo.png"
                alt="LogIt Logo"
                width={100}
                height={32}
                className="h-5 w-auto"
              />
              Git Proof
            </a>
          </div>

          {/* Nav - Centered */}
          <div className="flex-1 flex justify-center">
            <nav className="flex gap-6 text-sm font-medium">
              <a href="#problem" className="hover:underline">
                Problem
              </a>
              <a href="#solution" className="hover:underline">
                Solution
              </a>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
            </nav>
          </div>

          {/* Actions - Right */}
          <div className="flex-shrink-0 flex gap-2">
            <a
              href="#Contact Us"
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded hidden sm:block hover:bg-black/90 duration-200 ease-in-out transition font-reckless"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
