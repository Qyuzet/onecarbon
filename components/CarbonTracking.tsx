"use client";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import Image from "next/image";
import { connectMetaMask, checkMetaMaskConnection } from "@/utils/metamask";
import { ethers } from "ethers";
// Import the contract ABI directly.
const contractArtifact = {
  abi: [
    {
      inputs: [],
      name: "nextId",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "string", name: "companyName", type: "string" }],
      name: "registerCompany",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
      name: "depositCarbon",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "companyAddress", type: "address" },
      ],
      name: "isCompanyRegistered",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "companyAddress", type: "address" },
      ],
      name: "getCompanyName",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
  ],
};

interface WalletState {
  isConnected: boolean;
  account: string | null;
  provider?: ethers.providers.Web3Provider;
  network?: ethers.providers.Network;
}

interface CompanyState {
  name: string;
  isRegistered: boolean;
  isRegistering: boolean;
}

interface ProcessedDocument {
  name: string;
  footprint: number;
  category?: string;
  deposit: number;
  address?: string;
}

interface APIProcessedFile {
  name: string;
  footprint: number;
  size: number;
  contentLength: number;
}

const CarbonTrackingComponent = () => {
  // Wallet and company state
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    account: null,
  });
  const [company, setCompany] = useState<CompanyState>({
    name: "",
    isRegistered: false,
    isRegistering: false,
  });

  // State declarations
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [currentZipTotal, setCurrentZipTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState(0);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [terminalStatus, setTerminalStatus] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addTerminalStatus = (status: string) => {
    setTerminalStatus((prev) => [...prev, status]);
  };

  // Check wallet connection and company registration on mount
  useEffect(() => {
    const checkWalletAndCompany = async () => {
      const connection = await checkMetaMaskConnection();
      setWallet((prev) => ({ ...prev, ...connection }));

      if (connection.isConnected && connection.account && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
            contractArtifact.abi,
            signer
          );

          const isCompanyRegistered = await contract.isCompanyRegistered(
            connection.account
          );
          if (isCompanyRegistered) {
            const companyName = await contract.getCompanyName(
              connection.account
            );
            setCompany((prev) => ({
              ...prev,
              name: companyName,
              isRegistered: true,
            }));
            addTerminalStatus(`Company registered: ${companyName}`);
          }
        } catch (error) {
          console.error("Error checking company registration:", error);
        }
      }
    };
    checkWalletAndCompany();
  }, []);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      addTerminalStatus("Connecting to MetaMask...");
      const connection = await connectMetaMask();
      setWallet(connection);
      addTerminalStatus(`Connected to account: ${connection.account}`);
      addTerminalStatus(`Network: ${connection.network.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
      addTerminalStatus(`Error: ${errorMessage}`);
    }
  };

  // Handle company registration
  const handleRegisterCompany = async () => {
    if (!company.name.trim()) {
      addTerminalStatus("Error: Company name cannot be empty");
      return;
    }

    setCompany((prev) => ({ ...prev, isRegistering: true }));
    addTerminalStatus("Registering company...");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        contractArtifact.abi,
        signer
      );

      const tx = await contract.registerCompany(company.name);
      addTerminalStatus("Waiting for transaction confirmation...");
      await tx.wait();

      setCompany((prev) => ({ ...prev, isRegistered: true }));
      addTerminalStatus(`Company "${company.name}" successfully registered!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      addTerminalStatus(`Error: ${errorMessage}`);
    } finally {
      setCompany((prev) => ({ ...prev, isRegistering: false }));
    }
  };

  // Calculate total carbon footprint from all documents
  useEffect(() => {
    if (documents.length > 0) {
      const total = documents.reduce(
        (sum: number, doc: ProcessedDocument) => sum + doc.footprint,
        0
      );
      setResult(total);
    } else {
      setResult(null);
    }
  }, [documents]);

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return alert("Please select a ZIP file first!");
    if (!file.name.endsWith(".zip")) return alert("Please select a ZIP file!");
    if (!company.isRegistered)
      return alert("Please register your company first!");

    setIsLoading(true);
    setError(null);
    setCurrentZipTotal(null);
    setTerminalStatus([]);

    try {
      addTerminalStatus("Starting file processing...");
      addTerminalStatus(`Reading ZIP file: ${file.name}`);

      const formData = new FormData();
      formData.append("file", file);

      addTerminalStatus("Contacting API endpoint...");
      const res = await fetch("/api/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAnalyzedFiles(data.analyzedFiles);

      addTerminalStatus(`Found ${data.processedFiles.length} documents in ZIP`);
      const zipTotal = data.processedFiles.reduce(
        (sum: number, file: APIProcessedFile) => sum + file.footprint,
        0
      );
      setCurrentZipTotal(zipTotal);

      const newDocuments = data.processedFiles.map((file: APIProcessedFile) => {
        addTerminalStatus(`Processing document: ${file.name}`);
        return {
          name: file.name,
          footprint: file.footprint,
          category: "",
          deposit: 0,
          address: wallet.account || "",
        };
      });

      setTotalDocuments((prev) => prev + data.analyzedFiles);

      addTerminalStatus("Updating document history...");
      const allDocuments = [...newDocuments, ...documents];
      const finalDocuments = allDocuments.map(
        (doc: ProcessedDocument, index: number) => ({
          ...doc,
          deposit: allDocuments
            .slice(index)
            .reduce((sum, currentDoc) => sum + currentDoc.footprint, 0),
        })
      );

      // Store carbon data on blockchain
      if (wallet.isConnected && company.isRegistered && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
          contractArtifact.abi,
          signer
        );

        addTerminalStatus("Storing carbon data on blockchain...");
        const tx = await contract.depositCarbon(zipTotal);
        await tx.wait();
        addTerminalStatus("Carbon data stored successfully!");
      }

      setDocuments(finalDocuments);
      addTerminalStatus("Processing completed successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      addTerminalStatus(`Error: ${errorMessage}`);
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="-- input company name --"
                value={company.name}
                onChange={(e) =>
                  setCompany((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={company.isRegistered || !wallet.isConnected}
                className={`scale-[80%] border border-gray-600 text-white p-2 rounded w-50 text-center bg-transparent ${
                  !company.isRegistered && wallet.isConnected
                    ? "hover:border-white"
                    : ""
                } transition-colors duration-300`}
              />
              {wallet.isConnected && !company.isRegistered && (
                <button
                  onClick={handleRegisterCompany}
                  disabled={company.isRegistering || !company.name.trim()}
                  className={`scale-[80%] bg-transparent border-2 border-white text-white py-2 px-4 rounded-xl text-xs button-hover hover:bg-white hover:text-black transition-colors duration-300 ${
                    company.isRegistering || !company.name.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {company.isRegistering ? "Registering..." : "Register"}
                </button>
              )}
            </div>
            <div
              className={`scale-[80%] w-4 h-4 rounded-lg ${
                wallet.isConnected ? "bg-green-500" : "bg-red-500"
              } beeping`}
            ></div>
            <button
              onClick={handleConnectWallet}
              className={`scale-[80%] bg-transparent border-2 border-white text-white py-2 px-4 rounded-xl text-xs button-hover hover:bg-white hover:text-black transition-colors duration-300 ${
                wallet.isConnected ? "bg-white/10" : ""
              }`}
            >
              {wallet.isConnected
                ? `Connected: ${wallet.account?.slice(
                    0,
                    6
                  )}...${wallet.account?.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>

          {/* Header */}
          <h1 className="my-20 text-2xl font-extrabold text-center">
            Total Carbon Footprint:{" "}
            <span className="text-6xl">
              {result ? result.toFixed(2) : "--"} kg
            </span>{" "}
            CO₂
          </h1>

          {/* Stats Section */}
          <div className="flex justify-center space-x-12 text-xl mt-6 mb-44">
            <p>{result ? (result / 12).toFixed(2) : "-"} kg CO₂/month</p>
            <p>{result ? (result * 1).toFixed(2) : "-"} kg CO₂/year</p>
            <p>{result ? Math.ceil(result / 21.77) : "-"} Trees as equal</p>
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
                    {documents.length > 0 ? (
                      documents.map((doc: ProcessedDocument, index: number) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="py-3 px-4">{doc.name}</td>
                          <td className="py-3 px-4">
                            {doc.footprint.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            {doc.category || "empty"}
                          </td>
                          <td className="py-3 px-4">
                            {doc.deposit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">{doc.address || "----"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-gray-700">
                        <td className="py-3 px-4">empty</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">empty</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">----</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-1/3">
            <div className="flex flex-col items-center justify-center w-full mt-10">
              <span className="text-3xl text-center font-montserrat font-bold mb-4">
                {totalDocuments || "---"}
              </span>
              <span className="text-3xl text-center font-montserrat font-semibold">
                Analyzed
                <br /> Documents
              </span>
            </div>
          </div>
        </div>

        {/* File Upload & Processing Section */}
        <div className="mt-16 flex flex-col items-center justify-center space-y-4 pl-6 w-full">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col gap-4 items-start justify-center h-full">
              <div className="flex items-center gap-2">
                <button
                  className="border border-gray-600 p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() =>
                    document
                      .querySelector<HTMLInputElement>('input[type="file"]')
                      ?.click()
                  }
                >
                  Choose File
                </button>
                <span className="text-gray-400">
                  {file ? file.name : "No file chosen"}
                </span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              <div className="flex h-full flex-col items-center justify-center w-full text-center min-h-20 border-2 border-white/20 rounded-lg p-4 bg-white/5">
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
                  ) : currentZipTotal !== null ? (
                    <div className="space-y-2 w-full">
                      <div className="text-lg whitespace-nowrap">
                        Total Carbon Footprint: {currentZipTotal.toFixed(2)} kg
                        CO₂
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
                disabled={isLoading || !file || !company.isRegistered}
                className={`w-full border-2 border-white/20 transition text-white py-2 px-6 rounded ${
                  isLoading || !file || !company.isRegistered
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-transparent hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Processing..." : "Process"}
              </button>
            </div>
            <div className="flex flex-col w-full gap-4 items-start justify-start">
              <div className="flex flex-col gap-2 items-start justify-center">
                <span className="text-gray-400">endpoint:</span>
                <div className="flex items-center justify-center w-96 h-12 border-2 border-white/20 rounded-lg bg-white/5">
                  <span className="w-full overflow-x-auto whitespace-nowrap text-gray-400 px-4">{`http://localhost/carbontracking/`}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start justify-center">
                <span className="text-gray-400">agentic agent:</span>
                <div className="flex items-center justify-center gap-2 w-96 h-12 ">
                  <button className="w-full px-4 py-2 border-2 border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300 capitalize">
                    Set Agents
                  </button>
                  <button className="w-full px-4 py-2 border-2 border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300 capitalize">
                    Connect Agents
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start justify-center w-full">
                <span className="text-gray-400">terminal:</span>
                <div className="flex flex-col border-2 border-white/20 rounded-lg w-96 h-32 bg-white/5 overflow-hidden">
                  {terminalStatus.length > 0 ? (
                    <div
                      ref={terminalRef}
                      className="p-4 overflow-y-auto font-mono text-sm h-full"
                    >
                      {terminalStatus.map((status, index) => (
                        <div key={index} className="text-gray-300">
                          <span className="text-green-500">$</span> {status}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="text-gray-300">
                          <span className="text-green-500">$</span>{" "}
                          <span className="animate-pulse">_</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
                      <span>No active processes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonTrackingComponent;
