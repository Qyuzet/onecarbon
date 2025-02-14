import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="bg-[#111827] font-montserrat">
      ``
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
