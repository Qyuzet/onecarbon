import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="bg-[#111827] min-h-screen flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block text-purple-300 font-montserrat font-medium text-4xl sm:text-5xl md:text-6xl">
                The World First
              </span>
              <span className="block text-white font-montserrat font-semibold text-3xl sm:text-4xl md:text-5xl">
                Scope 3 Agentic Carbon
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl font-montserrat font-thin">
              Our technology leverages AI to automate scope 3 carbon reporting
              from company operational activity, automatically analyze, report,
              and store it on blockchain
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button className="w-full sm:w-auto px-10 text-white bg-transparent border-2 py-2 border-white rounded-md button-hover hover:bg-white hover:text-black transition-all duration-300">
                <Link href="/carbontracking">
                  <span className="sm:hidden">
                    Start Carbon
                    <br />
                    Tracking
                  </span>
                  <span className="hidden sm:inline">
                    Start Carbon Tracking
                  </span>
                </Link>
              </button>
              <button className="w-full sm:w-auto px-10 text-white bg-transparent border-2 py-2 border-white rounded-md button-hover hover:bg-white hover:text-black transition-all duration-300">
                <Link href="#ecosystem">Ecosystem</Link>
              </button>
            </div>
          </div>
        </div>
      </main>

      <section className="w-full py-16 pt-24 pb-60" id="ecosystem">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center px-4">
          <div className="w-full sm:w-[600px] relative">
            <Image
              src="/ecosystem-vertical.png"
              alt="Ecosystem Vertical"
              width={400}
              height={600}
              className="w-full h-auto mb-10 block sm:hidden mx-auto"
              priority
            />
            <Image
              src="/ecosystem.png"
              alt="Ecosystem"
              width={600}
              height={400}
              className="w-full h-auto mb-10 hidden sm:block mx-auto"
              priority
            />
          </div>
          <p className="text-base sm:text-sm text-white font-montserrat font-thin max-w-[600px] text-center">
            Our system combines multiple approaches to collaborate across
            multiple computers within the company, automatically analyze &
            report related information, creating an automatic carbon pipeline
            stored on blockchain.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
