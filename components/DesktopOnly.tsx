"use client";
import React from "react";
import Image from "next/image";

const DesktopOnly = () => {
  return (
    <div className="relative min-h-screen">
      {/* Background Layer */}
      <div className="fixed inset-0" style={{ zIndex: 1 }}>
        <Image
          src="/gradient-background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority={true}
          className="lg:object-[screen] md:object-[screen] sm:object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111827] top-[70%] h-[40%] transition-opacity duration-1000"></div>
      </div>

      {/* Content Layer */}
      <div
        className="relative flex flex-col items-center justify-center min-h-screen text-white px-4"
        style={{ zIndex: 2 }}
      >
        <Image
          src="/window.svg"
          alt="Desktop Only"
          width={120}
          height={120}
          className="mb-8"
        />
        <h1 className="text-4xl font-bold mb-4 text-center">
          Desktop Only Feature
        </h1>
        <p className="text-xl text-gray-300 max-w-md text-center">
          The Carbon Tracking feature is only available on desktop devices.
          Please access this page from a desktop computer for the best
          experience.
        </p>
      </div>
    </div>
  );
};

export default DesktopOnly;
