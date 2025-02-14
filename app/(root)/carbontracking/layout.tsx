import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="bg-[#111827] font-montserrat relative">
      <div className="relative z-50">
        <Navbar />
      </div>
      <div className="relative">{children}</div>
      <div className="relative z-50">
        <Footer />
      </div>
    </main>
  );
}
