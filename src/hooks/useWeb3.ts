import { useState } from 'react';
import { ethers } from 'ethers';
import LotteryABI from '../contracts/lotteryABI.json';
import { LOTTERY_CONTRACT_ADDRESS } from '../contracts/config';

declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider;
  }
}

export const useWeb3 = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Khởi tạo provider Ethers v6
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Yêu cầu user mở ví MetaMask
        const accounts = await provider.send("eth_requestAccounts", []);
        const currentAccount = accounts[0];
        setAccount(currentAccount);

        // Lấy Signer để ký giao dịch
        const signer = await provider.getSigner();
        
        // Khởi tạo instance của Smart Contract
        const lotteryContract = new ethers.Contract(
          LOTTERY_CONTRACT_ADDRESS,
          LotteryABI,
          signer
        );

        setContract(lotteryContract);
      } catch (error) {
        console.error("Lỗi kết nối ví:", error);
        alert("Kết nối thất bại. Vui lòng thử lại!");
      }
    } else {
      alert("Vui lòng cài đặt tiện ích ví MetaMask trên trình duyệt!");
    }
    setIsConnecting(false);
  };

  return { account, contract, connectWallet, isConnecting };
};