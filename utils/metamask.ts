import { ethers } from "ethers";

type EthereumRequest = {
  method: string;
  params?: unknown[];
};

type MetaMaskEventHandler = (params: unknown) => void;

declare global {
  interface Window {
    ethereum?: {
      request: (args: EthereumRequest) => Promise<unknown>;
      on: (eventName: string, handler: MetaMaskEventHandler) => void;
      removeListener: (
        eventName: string,
        handler: MetaMaskEventHandler
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

    // Request account access
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const account = accounts[0];
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    return {
      isConnected: true,
      account,
      provider,
      network,
    };
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
};

export const checkMetaMaskConnection = async () => {
  try {
    if (!window.ethereum) {
      return { isConnected: false, account: null };
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];

    if (accounts.length === 0) {
      return { isConnected: false, account: null };
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    return {
      isConnected: true,
      account: accounts[0],
      provider,
      network,
    };
  } catch (error) {
    console.error("Error checking MetaMask connection:", error);
    return { isConnected: false, account: null };
  }
};

// Listen for account changes
export const setupMetaMaskListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
) => {
  if (!window.ethereum) return;

  const handleAccountsChanged = (accounts: unknown) => {
    if (Array.isArray(accounts)) {
      onAccountsChanged(accounts as string[]);
    }
  };

  const handleChainChanged = (chainId: unknown) => {
    if (typeof chainId === "string") {
      onChainChanged(chainId);
    }
  };

  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);

  return () => {
    window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum?.removeListener("chainChanged", handleChainChanged);
  };
};
