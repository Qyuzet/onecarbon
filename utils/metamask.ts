import { ethers } from "ethers";

type EthereumRequest = {
  method: string;
  params?: unknown[];
};

type MetaMaskError = {
  code: number;
  message: string;
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: EthereumRequest) => Promise<unknown>;
      on: (eventName: string, handler: (params: unknown) => void) => void;
      removeListener: (
        eventName: string,
        handler: (params: unknown) => void
      ) => void;
      isMetaMask?: boolean;
    };
  }
}

export const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask browser extension");
    }

    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const account = accounts[0];
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    return {
      account,
      provider,
      network,
      isConnected: true,
    };
  } catch (error) {
    const metaMaskError = error as MetaMaskError;
    console.error("Error connecting to MetaMask:", metaMaskError);
    throw new Error(metaMaskError.message || "Failed to connect to MetaMask");
  }
};

export const checkMetaMaskConnection = async () => {
  try {
    if (!window.ethereum) {
      return { isConnected: false };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];

    return {
      isConnected: accounts.length > 0,
      account: accounts[0] || null,
    };
  } catch (error) {
    const metaMaskError = error as MetaMaskError;
    console.error("Error checking MetaMask connection:", metaMaskError);
    return { isConnected: false };
  }
};
