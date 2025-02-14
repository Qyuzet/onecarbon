// components/Navbar.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MobileMenuButton from "@/components/MobileMenuButton";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-[#111827] relative z-[999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex  w-full justify-center items-center">
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4 text-white">
              <Button variant="ghost" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/carbontracking">Carbon Tracking</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/#ecosystem">Ecosystem</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="https://manta.network/" target="_blank">
                  Network
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/consultation">Consultation</Link>
              </Button>
            </div>

            <div className="flex-shrink-0 flex items-center pl-20">
              <Image
                src="/oneCarbon-logo.png"
                alt="logo"
                width={150}
                height={500}
              />
            </div>
          </div>

          <div className="flex items-center sm:hidden">
            <MobileMenuButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
