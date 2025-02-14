import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative py-6 px-10">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Looper-background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="lg:object-[screen] md:object-[screen] sm:object-cover"
        />
      </div>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <Link href="/dashboard">
                <span className="text-2xl font-bold text-white hover:text-gray-300">
                  oneCarbon
                </span>
              </Link>
              <p className="mt-2 text-sm text-white">
                Revolutionizing carbon tracking and reporting with AI and
                blockchain technology.
              </p>
              <div className="flex space-x-6 mt-6">
                {/* Social icons would go here */}
              </div>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Product
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-base text-white hover:text-gray-300"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
