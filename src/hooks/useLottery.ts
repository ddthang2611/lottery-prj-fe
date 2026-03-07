"use client";

import { useState } from "react";
import { ethers } from "ethers";

export type ActiveLottery = {
  _id: string;
  type: number;
  totalBalance: number | string;
  endTime: string;
  startTime?: string;
  status?: number;
  address?: string;
};

export function useLottery() {
  const [isPending, setIsPending] = useState(false);

  const ensureSepoliaNetwork = async () => {
    if (!window.ethereum) return;
    const sepoliaHexId = "0xaa36a7"; // 11155111 sang Hex

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    if (currentChainId !== sepoliaHexId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: sepoliaHexId }],
        });
      } catch (switchError: unknown) {
        if ((switchError as { code: number }).code === 4902) {
          // Nếu ví chưa có mạng Sepolia thì tự động thêm
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: sepoliaHexId,
                chainName: "Sepolia Testnet",
                rpcUrls: ["https://rpc.sepolia.org"],
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "SEP",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } else {
          throw new Error(
            "Vui lòng chuyển sang mạng Sepolia trên Metamask để tiếp tục.",
          );
        }
      }
    }
  };

  const createLottery = async (
    account: string,
    expiredTime: number, // Timestamp (giây)
    type: number,
    oldLotteryId?: string,
  ) => {
    setIsPending(true);
    try {
      await ensureSepoliaNetwork();
      const response = await fetch("http://localhost:3000/lottery/active-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account, // Vẫn truyền để DTO của BE không báo lỗi thiếu field
          expiredTime: expiredTime,
          type: type,
          oldLotteryId: oldLotteryId || "",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Không thể chuẩn bị giao dịch tạo giải",
        );
      }

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction(result.data.transactionToSign);

      console.log("Đang gửi yêu cầu tạo giải. Tx Hash:", tx.hash);

      await tx.wait();

      return {
        success: true,
        hash: tx.hash,
        newLotteryId: result.data.newLotteryId,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Lỗi tạo giải mới:", err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const buyTicket = async (
    account: string,
    lotteryId: string,
    numbers: number[],
  ) => {
    setIsPending(true);
    try {
      await ensureSepoliaNetwork();
      const response = await fetch(
        `http://localhost:3000/lottery/${lotteryId}/buy-ticket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotteryId: lotteryId,
            walletAddress: account,
            numbers: numbers,
          }),
        },
      );

      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "Lỗi tạo vé từ Backend");

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ethers.parseUnits chuyển đổi trực tiếp số Gwei sang Wei cho chuẩn xác
      const ticketPriceInWei = ethers.parseUnits("10", "gwei"); // 10 Gwei = 10000000000 Wei

      const tx = await signer.sendTransaction({
        to: result.data.transactionToSign.to,
        data: result.data.transactionToSign.data,
        value: ticketPriceInWei,
      });

      console.log("Đang mua vé. Tx Hash:", tx.hash);
      await tx.wait();

      return { success: true, hash: tx.hash };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Lỗi mua vé:", err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const drawWinner = async (account: string, lotteryId: string) => {
    setIsPending(true);
    try {
      // (Tuỳ chọn) Đảm bảo người dùng đang ở đúng mạng Sepolia
      if (typeof ensureSepoliaNetwork === "function") {
        await ensureSepoliaNetwork();
      }

      // ==========================================
      // BƯỚC 1: LẤY GIAO DỊCH TỪ BACKEND
      // ==========================================
      const response = await fetch(
        "http://localhost:3000/lottery/draw-winner",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: account,
            lotteryId: lotteryId,
          }),
        },
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.message || "Không thể chuẩn bị giao dịch đóng giải",
        );
      }

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ==========================================
      // BƯỚC 2: KÝ VÀ GỬI LÊN SMART CONTRACT
      // ==========================================
      const tx = await signer.sendTransaction(result.data.transactionToSign);
      console.log("Đang gửi giao dịch đóng giải. Tx Hash:", tx.hash);

      // Chờ Blockchain xác nhận block chứa giao dịch này
      await tx.wait();
      console.log(
        "Giao dịch thành công! Đang chờ Oracle (Chainlink VRF) quay số...",
      );

      // ==========================================
      // BƯỚC 3: DÒ TÌM KẾT QUẢ (POLLING)
      // ==========================================
      const contractAddress = result.data.transactionToSign.to;
      const contract = new ethers.Contract(
        contractAddress,
        [
          "function getLotteryResult(bytes memory _id) public view returns (uint8[] memory)",
        ],
        provider,
      );

      const lotteryIdBytes = "0x" + lotteryId;
      let winningNumbers: number[] = [];
      let attempts = 0;
      const MAX_ATTEMPTS = 30; // Thử tối đa 30 lần (Khoảng 5 phút)

      // Vòng lặp chờ Contract có kết quả (Mảng hết rỗng)
      while (winningNumbers.length === 0 && attempts < MAX_ATTEMPTS) {
        attempts++;
        console.log(
          `Đang dò kết quả trên chuỗi (Lần ${attempts}/${MAX_ATTEMPTS})...`,
        );

        // Nghỉ 10 giây trước mỗi lần đọc để tránh spam RPC rớt mạng
        await new Promise((resolve) => setTimeout(resolve, 10000));

        try {
          const resultOnChain = await contract.getLotteryResult(lotteryIdBytes);

          // Nếu mảng trả về có dữ liệu, gán vào winningNumbers để bẻ gãy vòng lặp
          if (resultOnChain && resultOnChain.length > 0) {
            winningNumbers = resultOnChain.map((n: unknown) => Number(n));
          }
        } catch (readError) {
          console.warn("Lỗi đọc contract tạm thời, đang thử lại...", readError);
        }
      }

      // Nếu hết 1 phút mà mạng lag/Chainlink chưa trả về
      if (winningNumbers.length === 0) {
        throw new Error(
          "⏳ Quá thời gian chờ số ngẫu nhiên. Giải đã được đóng nhưng Oracle chưa trả số. Vui lòng đồng bộ lại sau!",
        );
      }

      console.log("🎉 ĐÃ CÓ KẾT QUẢ CHÍNH THỨC:", winningNumbers);

      // ==========================================
      // BƯỚC 4: BÁO CHO BACKEND ĐỂ CẬP NHẬT DB
      // ==========================================
      const syncResponse = await fetch(
        `http://localhost:3000/lottery/${lotteryId}/sync-result`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: winningNumbers }),
        },
      );

      const syncResult = await syncResponse.json();
      if (!syncResult.success) {
        console.warn("⚠️ Contract đã có số nhưng lỗi lưu DB:", syncResult);
      } else {
        console.log(
          "💾 Đồng bộ Database thành công! Các vé trúng thưởng đã được Active.",
        );
      }

      return { success: true, hash: tx.hash, winningNumbers };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("❌ Lỗi quay số:", err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const getMyTickets = async (account: string) => {
    try {
      // Giả sử route của bạn là GET /ticket?walletAddress=...
      const response = await fetch(
        `http://localhost:3000/ticket?walletAddress=${account.toLowerCase()}`,
      );
      const result = await response.json();

      if (result.success) {
        return result.data; // Mảng chứa các ticket: { _id, numbers, isClaimed, lottery: { lotteryId, type } }
      }
      return [];
    } catch (error) {
      console.error("Lỗi lấy danh sách vé:", error);
      return [];
    }
  };

  const claimReward = async (account: string, ticketId: string) => {
    setIsPending(true);
    try {
      // 1. Gọi BE để xin mã hoá giao dịch
      const response = await fetch(
        "http://localhost:3000/lottery/claim-reward",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, walletAddress: account }),
        },
      );

      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "Lỗi tạo giao dịch nhận thưởng");

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Metamask bật lên yêu cầu người dùng ký nhận ETH
      const tx = await signer.sendTransaction(result.data.transactionToSign);
      console.log("Đang xử lý nhận thưởng. Tx Hash:", tx.hash);

      // Chờ Blockchain xác nhận tiền đã vào ví
      await tx.wait();
      console.log("Nhận thưởng trên chuỗi thành công!");

      // 3. Báo cho BE biết để cập nhật DB (isClaimed = true)
      await fetch("http://localhost:3000/lottery/claim-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      return { success: true, hash: tx.hash };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Lỗi khi nhận thưởng:", err);
      throw error;
    } finally {
      setIsPending(false);
    }
  };
  return {
    createLottery,
    buyTicket,
    drawWinner,
    getMyTickets,
    claimReward,
    isPending,
  };
}

export const getActiveLotteries = async (
  type?: string | number,
): Promise<ActiveLottery[]> => {
  try {
    if (type) {
      const res = await fetch(
        `http://localhost:3000/lottery/active?type=${type}`,
      );
      const json = await res.json();
      return json.success ? json.data.items : [];
    }

    const [res1, res2] = await Promise.all([
      fetch(`http://localhost:3000/lottery/active?type=1`),
      fetch(`http://localhost:3000/lottery/active?type=2`),
    ]);

    const json1 = await res1.json();
    const json2 = await res2.json();

    // SẠCH BÓNG LỖI ESLINT Ở ĐÂY
    let lotteries: ActiveLottery[] = [];

    if (json1.success) lotteries = [...lotteries, ...json1.data.items];
    if (json2.success) lotteries = [...lotteries, ...json2.data.items];

    return lotteries;
  } catch (error) {
    console.error("Lỗi fetch giải đấu:", error);
    return [];
  }
};
