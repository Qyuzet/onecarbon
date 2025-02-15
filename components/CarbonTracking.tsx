"use client";
import React from "react";
import { useState } from "react";
import Image from "next/image";

const CarbonTracking = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState(0);

  const handleUpload = async () => {
    if (!file) return alert("Please select a ZIP file first!");
    if (!file.name.endsWith(".zip")) return alert("Please select a ZIP file!");

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult(data.totalCarbonFootprint);
      setAnalyzedFiles(data.analyzedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex justify-start w-full max-w-4xl mt-4 items-center gap-4">
            <input
              type="text"
              placeholder="-- input company name --"
              className="scale-[80%] border border-gray-600 text-white p-2 rounded w-50 text-center bg-transparent hover:border-white transition-colors duration-300"
            />
            <div className="scale-[80%] w-4 h-4 rounded-lg bg-red-500 beeping"></div>
            <button className="scale-[80%] bg-transparent border-2 border-white text-white py-2 px-4 rounded-xl text-xs button-hover hover:bg-white hover:text-black transition-colors duration-300">
              Connect Wallet
            </button>
            <div className="absolute right-44 flex items-center justify-center">
              <button className="button-hover p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-300">
                <Image
                  src="/download-icon.png"
                  alt="download icon"
                  width={32}
                  height={32}
                  className="transition-transform hover:scale-110 duration-300"
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

        {/* Content Section */}
        <div className="flex gap-4 px-6">
          {/* Left Panel */}
          <div className="flex-grow">
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

          {/* Right Panel */}
          <div className="w-1/3">
            <div className="flex flex-col items-center justify-center w-full mt-10">
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
        </div>

        {/* File Upload & Processing Section */}
        <div className="mt-16 flex flex-col items-center justify-center space-y-4 pl-6 w-full ">
          <div className="flex space-x-4">
            <div className="flex flex-col gap-4 items-start justify-center">
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border border-gray-600 p-2 rounded"
              />
              <div className="flex h-full flex-col items-center justify-center w-full text-center min-h-20 border-2 border-white p-4">
                <span className="text-white">
                  {isLoading ? (
                    <div>
                      <div>Processing files... Please wait.</div>
                      <div className="text-sm mt-2 text-gray-400">
                        This may take a few moments depending on the file size.
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-red-500">
                      <div>Error: {error}</div>
                      <div className="text-sm mt-2">
                        Please ensure:
                        <ul className="list-disc list-inside mt-1">
                          <li>Your ZIP file contains PDF or text files</li>
                          <li>Files are not corrupted</li>
                          <li>Files are properly formatted</li>
                        </ul>
                      </div>
                    </div>
                  ) : result !== null ? (
                    <div className="space-y-2">
                      <div className="text-lg">
                        Total Carbon Footprint: {result.toFixed(2)} kg CO₂
                      </div>
                      <div className="text-sm">
                        Successfully analyzed {analyzedFiles}{" "}
                        {analyzedFiles === 1 ? "file" : "files"}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div>
                        Upload a ZIP file containing PDF or text files to
                        analyze carbon footprint
                      </div>
                      <div className="text-sm mt-2 text-gray-400">
                        Files will be processed and analyzed using AI
                      </div>
                    </div>
                  )}
                </span>
              </div>
              <button
                onClick={handleUpload}
                disabled={isLoading || !file}
                className={`w-full border-2 border-white transition text-white py-2 px-6 rounded ${
                  isLoading || !file
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-transparent hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Processing..." : "Process"}
              </button>
            </div>
            <div className="flex flex-col w-full gap-4 items-start justify-start">
              <div className="flex flex-col gap-2 items-start justify-center">
                <span className="h-full">endpoint: </span>
                <div className="flex items-center justify-center w-96 h-12 border-2 border-white rounded-lg">
                  <span className="w-full overflow-x-auto whitespace-nowrap text-gray-400 block">{`http://localhost/carbontracking/`}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start justify-center">
                <span className="h-full">agentic agent: </span>
                <div className="flex items-center justify-center gap-2 w-96 h-12 ">
                  <button className="w-full px-4 py-2 border-2 border-white rounded-lg button-hover hover:bg-white hover:text-black transition-colors duration-300 capitalize">
                    Set Agents
                  </button>
                  <button className="w-full px-4 py-2 border-2 border-white rounded-lg button-hover hover:bg-white hover:text-black transition-colors duration-300 capitalize">
                    Connect Agents
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start justify-center">
                <span className="h-full">terminal: </span>
                <div className="flex border-2 border-white rounded-lg h-full items-center justify-center gap-2 w-96 h-12 ">
                  <span>...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonTracking;
