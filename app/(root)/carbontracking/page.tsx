"use client";
import React, { useEffect, useState } from "react";
import CarbonTracking from "@/components/CarbonTracking";
import DesktopOnly from "@/components/DesktopOnly";

const Page = () => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // 1024px is typically considered desktop
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return <>{isDesktop ? <CarbonTracking /> : <DesktopOnly />}</>;
};

export default Page;
