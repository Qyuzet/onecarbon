"use client";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import Image from "next/image";
import { connectMetaMask, checkMetaMaskConnection } from "@/utils/metamask";
import { ethers } from "ethers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      inputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      name: "depositCarbon",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
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
    {
      inputs: [],
      name: "getEntries",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "address", name: "user", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
            { internalType: "string", name: "companyName", type: "string" },
            {
              internalType: "bytes32",
              name: "transactionHash",
              type: "bytes32",
            },
          ],
          internalType: "struct CarbonTracking.CarbonEntry[]",
          name: "",
          type: "tuple[]",
        },
      ],
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
  name: string; // Will store the PDF file name
  footprint: number;
  category: string; // Will be "PDF" for documents
  deposit: number;
  address?: string;
  transactionHash?: string;
}

interface APIProcessedFile {
  name: string;
  footprint: number;
  size: number;
  contentLength: number;
}

const CarbonTrackingComponent = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    account: null,
  });
  const [company, setCompany] = useState<CompanyState>({
    name: "",
    isRegistered: false,
    isRegistering: false,
  });

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
  const [totalCarbonFootprint, setTotalCarbonFootprint] = useState(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success("Copied to clipboard!");
  };

  const handleConnectWallet = async () => {
    try {
      addTerminalStatus("Connecting to MetaMask...");
      const connection = await connectMetaMask();
      setWallet(connection);
      addTerminalStatus(`Connected to account: ${connection.account}`);
      addTerminalStatus(`Network: ${connection.network.name}`);

      // Check company registration after connection
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

            // Fetch and process entries
            const entries = await contract.getEntries();
            const userEntries = entries.filter(
              (entry) =>
                entry.user.toLowerCase() === connection.account.toLowerCase()
            );

            const processedEntries = userEntries.map((entry) => ({
              name: entry.companyName,
              footprint: Number(entry.amount),
              category: "",
              deposit: Number(entry.amount),
              address: entry.user,
              transactionHash: entry.transactionHash,
            }));

            // Calculate cumulative deposits
            const entriesWithDeposits = processedEntries.map((doc, index) => ({
              ...doc,
              deposit: processedEntries
                .slice(index)
                .reduce((sum, currentDoc) => sum + currentDoc.footprint, 0),
            }));

            setDocuments(entriesWithDeposits);
          }
        } catch (error) {
          console.error("Error checking company registration:", error);
          addTerminalStatus(`Error: ${error.message}`);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
      addTerminalStatus(`Error: ${errorMessage}`);
    }
  };

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

      // After successful registration, initialize empty documents array
      setDocuments([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      addTerminalStatus(`Error: ${errorMessage}`);
    } finally {
      setCompany((prev) => ({ ...prev, isRegistering: false }));
    }
  };

  const addTerminalStatus = (status: string) => {
    setTerminalStatus((prev) => [...prev, status]);
  };

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

            // Fetch and process entries
            const entries = await contract.getEntries();
            const userEntries = entries.filter(
              (entry) =>
                entry.user.toLowerCase() === connection.account.toLowerCase()
            );

            const processedEntries = userEntries.map((entry) => ({
              name: entry.companyName,
              footprint: Number(entry.amount),
              category: "",
              deposit: Number(entry.amount),
              address: entry.user,
              transactionHash: entry.transactionHash,
            }));

            // Calculate cumulative deposits and update totals
            const entriesWithDeposits = processedEntries.map((doc, index) => ({
              ...doc,
              deposit: processedEntries
                .slice(0, index + 1)
                .reduce((sum, currentDoc) => sum + currentDoc.footprint, 0),
            }));

            setDocuments(entriesWithDeposits);
            calculateTotals(processedEntries); // Calculate and update totals

            setTotalDocuments(entriesWithDeposits.length);
          }
        } catch (error) {
          console.error("Error checking company registration:", error);
          addTerminalStatus(`Error: ${error.message}`);
        }
      }
    };
    checkWalletAndCompany();
  }, []);

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

      addTerminalStatus(`Found ${data.processedFiles.length} documents in ZIP`);
      const zipTotal = data.processedFiles.reduce(
        (sum: number, file: APIProcessedFile) => sum + file.footprint,
        0
      );
      setCurrentZipTotal(zipTotal);

      // Create new documents with actual file names
      const newDocuments = data.processedFiles.map(
        (file: APIProcessedFile) => ({
          name: file.name.split("/").pop() || file.name, // Get just the file name without path
          footprint: file.footprint,
          category: "PDF", // Since we know these are PDF files
          deposit: file.footprint,
          address: wallet.account || "",
        })
      );

      // Update analyzed files count
      setAnalyzedFiles((prev) => prev + data.processedFiles.length);

      // Blockchain storage
      if (wallet.isConnected && company.isRegistered && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
            contractArtifact.abi,
            signer
          );

          addTerminalStatus("Storing carbon data on blockchain...");

          // Store individual document footprints
          const amountsArray = data.processedFiles.map(
            (file: APIProcessedFile) => Math.floor(file.footprint)
          );

          const tx = await contract.depositCarbon(amountsArray);
          const receipt = await tx.wait();

          addTerminalStatus("Carbon data stored successfully!");

          // Update documents with transaction hash
          const documentsWithHash = newDocuments.map((doc) => ({
            ...doc,
            transactionHash: receipt.transactionHash,
          }));

          // // Update documents state
          // setDocuments((prevDocs) => [...documentsWithHash, ...prevDocs]);

          // // Update total stored documents count
          // setTotalDocuments((prev) => prev + data.processedFiles.length);

          if (receipt) {
            const updatedDocs = [...documentsWithHash, ...documents];
            setTotalDocuments((prev) => prev + data.processedFiles.length);
            setDocuments(updatedDocs);
            calculateTotals(updatedDocs);
          }
        } catch (error) {
          console.error("Transaction failed:", error);
          addTerminalStatus("Failed to store carbon data.");
          // ... error handling ...
        }
      }
    } catch (err) {
      // ... error handling ...
    }
  };

  const calculateTotals = (entries) => {
    const total = entries.reduce(
      (sum, entry) => sum + Number(entry.footprint),
      0
    );
    setTotalCarbonFootprint(total);
    setResult(total); // This will update the main display
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
          <TooltipProvider>
            <div className="max-w-4xl mx-auto mt-10 border border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <Table className="w-full text-left text-sm">
                  <TableHeader className="bg-gray-700 text-gray-300 uppercase">
                    <TableRow>
                      <TableHead className="py-3 px-4">Document</TableHead>
                      <TableHead className="py-3 px-4">Carbon (kg)</TableHead>
                      <TableHead className="py-3 px-4">Type</TableHead>
                      <TableHead className="py-3 px-4">Deposit (kg)</TableHead>
                      <TableHead className="py-3 px-4">TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.length > 0 ? (
                      documents.slice(0, 5).map((doc, index) => (
                        <TableRow
                          key={index}
                          className="border-t border-gray-700"
                        >
                          <TableCell className="py-3 px-4">
                            {doc.name}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {doc.footprint.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {doc.category || "PDF"}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {doc.deposit.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {doc.transactionHash ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      handleCopy(doc.transactionHash)
                                    }
                                    className="text-xs break-all bg-gray-800 px-2 py-1 rounded hover:bg-gray-700 transition"
                                  >
                                    {`${doc.transactionHash.slice(
                                      0,
                                      6
                                    )}...${doc.transactionHash.slice(-4)}`}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 text-white text-xs p-2 rounded">
                                  <span>{doc.transactionHash}</span>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              "----"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-t border-gray-700">
                        <TableCell className="py-3 px-4">
                          No documents
                        </TableCell>
                        <TableCell className="py-3 px-4">-</TableCell>
                        <TableCell className="py-3 px-4">-</TableCell>
                        <TableCell className="py-3 px-4">-</TableCell>
                        <TableCell className="py-3 px-4">----</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TooltipProvider>

          {/* Right Panel */}

          <div className="w-1/3">
            <div className="flex flex-col items-center justify-center w-full mt-10">
              <span className="text-3xl text-center font-montserrat font-bold mb-4">
                {totalDocuments || "0"}
              </span>
              <span className="text-3xl text-center font-montserrat font-semibold">
                Documents
                <br /> Stored
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
