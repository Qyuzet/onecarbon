"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MobileMenuButton() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-white button-hover hover:bg-white hover:text-black transition-all duration-300"
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="absolute top-16 inset-x-0 z-[998] bg-white dark:bg-gray-800 sm:hidden">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start button-hover hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link href="/">Dashboard</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start button-hover hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link href="/carbontracking">Carbon Tracking</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start button-hover hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link href="/#ecosystem">Ecosystem</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start button-hover hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link href="https://manta.network/" target="_blank">
                Network
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start button-hover hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link href="/consultation">Consultation</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
