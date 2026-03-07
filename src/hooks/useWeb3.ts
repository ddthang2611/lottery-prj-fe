import { useState, useEffect } from "react";
import { ethers } from "ethers";
import lotteryABI from "../contracts/lottery-abi.json";
import { LOTTERY_CONTRACT_ADDRESS } from "../contracts/config";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider & {
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        callback: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

export const useWeb3 = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [isChecking, setIsChecking] = useState(true);

  // check wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // check logout in localStorage
          const isDisconnectedManually = localStorage.getItem(
            "isDisconnectedManually",
          );

          if (isDisconnectedManually === "true") {
            setIsChecking(false);
            return;
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          // Kiểm tra xem có account nào đang kết nối sẵn không
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            setAccount(accounts[0].address);

            // Khởi tạo luôn contract nếu đã kết nối
            const signer = await provider.getSigner();
            const lotteryContract = new ethers.Contract(
              LOTTERY_CONTRACT_ADDRESS,
              lotteryABI,
              signer,
            );
            setContract(lotteryContract);
          }
        } catch (error) {
          console.error("Lỗi tự động kiểm tra kết nối:", error);
        }
      }
      setIsChecking(false);
    };

    checkConnection();

    // MỚI: Lắng nghe sự kiện đổi ví hoặc ngắt kết nối từ MetaMask
    const handleAccountsChanged = (...args: unknown[]) => {
      // Ép kiểu phần tử đầu tiên của args thành mảng chuỗi
      const accounts = args[0] as string[];

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        // User ngắt kết nối
        setAccount(null);
        setContract(null);
      }
    };

    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Cleanup listener
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
      }
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        localStorage.removeItem("isDisconnectedManually");

        const provider = new ethers.BrowserProvider(window.ethereum);

        const accounts = await provider.send("eth_requestAccounts", []);
        const currentAccount = accounts[0];

        await fetch("http://localhost:3000/user/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: currentAccount }),
        });

        setAccount(currentAccount);

        const signer = await provider.getSigner();

        const lotteryContract = new ethers.Contract(
          LOTTERY_CONTRACT_ADDRESS,
          lotteryABI,
          signer,
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

  const disconnectWallet = () => {
    localStorage.setItem("isDisconnectedManually", "true");
    setAccount(null);
    setContract(null);
  };

  return {
    account,
    contract,
    connectWallet,
    isConnecting,
    isChecking,
    disconnectWallet,
  };
};
