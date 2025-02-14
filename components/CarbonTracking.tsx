"use client";
import React from "react";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Image from "next/image";

const CarbonTracking = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const handleUpload = async () => {
    if (!file) return alert("Pilih file ZIP terlebih dahulu!");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data.totalCarbonFootprint);
  };

  return (
    <div className="relative">
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
        className="relative min-h-screen text-white mb-20"
        style={{ zIndex: 2 }}
      >
        <div className="flex flex-col items-center p-6">
          {/* Connector */}
          <div className="flex justify-start w-full max-w-4xl mt-4">
            <input
              type="text"
              placeholder="-- input company name --"
              className="scale-[80%] border border-gray-600 text-white p-2 rounded w-50 text-center bg-transparent"
            />
            <div className="scale-[80%] px-4 py-4 bg-red-500"></div>
            <button className="scale-[80%] bg-transparent border-2 border-white text-white py-2 px-2 rounded-xl text-xs">
              Connect Wallet
            </button>
            <div className="absolute right-44 flex items-center justify-center">
              <button>
                {" "}
                <Image
                  src="/download-icon.png"
                  alt="donwload icon"
                  width={32}
                  height={32}
                />
              </button>
            </div>
          </div>

          {/* Header */}
          <h1 className="my-20 text-2xl font-extrabold text-center">
            This Year <span className="text-6xl">-- kg</span> CO₂
          </h1>

          {/* Stats Section */}
          <div className="flex justify-center space-x-12 text-xl mt-6 mb-44">
            <p>- kg CO₂/month</p>
            <p>- kg CO₂/year</p>
            <p>- Trees as equal</p>
          </div>
        </div>
        {/* Documents Table */}
        <div className="relative">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[200px] w-full rounded-lg md:min-w-[450px]"
          >
            <ResizablePanel defaultSize={65}>
              <div className="flex h-full items-center justify-center p-6">
                <div className="w-full max-w-4xl mt-10">
                  <div className="overflow-hidden border border-gray-700 rounded-lg mt-4">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-700 text-gray-300 uppercase">
                        <tr>
                          <th className="py-3 px-4">Current Documents</th>
                          <th className="py-3 px-4">Carbon (kg)</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Deposit (kg)</th>
                          <th className="py-3 px-4">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-700">
                          <td className="py-3 px-4">empty</td>
                          <td className="py-3 px-4">-</td>
                          <td className="py-3 px-4">empty</td>
                          <td className="py-3 px-4">-</td>
                          <td className="py-3 px-4">----</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35}>
              <div className="flex h-full items-center justify-center p-6">
                <div className="flex flex-col items-center justify-center w-full max-w-4xl mt-10">
                  <span className="text-3xl text-center font-montserrat font-bold mb-4">
                    {" "}
                    {`---`}
                  </span>

                  <span className="text-3xl text-center font-montserrat font-semibold">
                    {" "}
                    Analyzed
                    <br /> Documents
                  </span>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* File Upload & Processing Section */}
        <div className="mt-8 flex flex-col items-start justify-start space-y-4 pl-6">
          <div className="flex space-x-4">
            <div className="flex flex-col gap-4 items-start justify-center">
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border border-gray-600 p-2 rounded"
              />
              <div className="flex items-center justify-center w-full text-center h-20 border-2 border-white">
                <span className="text-white">
                  hi
                  {result !== null && (
                    <div className="mt-6 text-lg">
                      Jejak Karbon: {result.toFixed(2)} kg CO₂
                    </div>
                  )}
                </span>
              </div>
              <button
                onClick={handleUpload}
                className="w-full border-2 border-white bg-transparent hover:bg-blue-700 transition text-white py-2 px-6 rounded"
              >
                Process
              </button>
            </div>
            <div className="flex items-center justify-center w-96 h-12 border-2 border-white rounded-lg">
              <span className="overflow-x-auto whitespace-nowrap text-gray-400 block">{`http://localhost/carbontracking/`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonTracking;
