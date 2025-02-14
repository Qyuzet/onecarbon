import { ethers } from "ethers";
import CarbonTracking from "../artifacts/contracts/CarbonTracking.json";

const contractAddress = "0x123..."; // Ganti dengan alamat smart contract di Manta Network
const abi = CarbonTracking.abi;

export async function depositCarbon(amount: number) {
  if (!window.ethereum) throw new Error("Metamask tidak ditemukan");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const tx = await contract.depositCarbon(amount);
  await tx.wait();

  return tx;
}
