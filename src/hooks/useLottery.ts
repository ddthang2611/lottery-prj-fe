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

  const createLottery = async (data: {
    account: string;
    newLotteryId: string;
    oldLotteryId: string;
    expireTime: string;
    lotteryType: string;
  }) => {
    setIsPending(true);
    try {
      const expiredTimestamp = Math.floor(
        new Date(data.expireTime).getTime() / 1000,
      );

      const response = await fetch("http://localhost:3000/lottery/active-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: data.account,
          oldLotteryId: data.oldLotteryId === "none" ? "" : data.oldLotteryId,
          expiredTime: expiredTimestamp,
          type: Number(data.lotteryType),
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      if (!window.ethereum) {
        throw new Error("Vui lòng cài đặt Metamask để thực hiện giao dịch");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction(result.data.transactionToSign);

      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(err);
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
      const response = await fetch("http://localhost:3000/lottery/buy-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotteryId: lotteryId,
          walletAddress: account,
          numbers: numbers,
        }),
      });

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
      if (!result.success) throw new Error(result.message);

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction(result.data.transactionToSign);

      console.log("Đang gửi giao dịch quay số. Tx Hash:", tx.hash);
      await tx.wait();

      return { success: true, hash: tx.hash };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const claimReward = async (account: string, ticketId: string) => {
    setIsPending(true);
    try {
      // 1. Gọi API Backend để lấy dữ liệu giao dịch đã mã hóa
      // Sử dụng đúng endpoint bạn đã định nghĩa trong TicketController
      const response = await fetch(
        "http://localhost:3000/ticket/claim-reward",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: account,
            ticketId: ticketId,
          }),
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Không thể chuẩn bị giao dịch nhận thưởng",
        );
      }

      if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Gửi giao dịch ký lên Blockchain
      // result.data.transactionToSign chứa { to, data } đã được BE encode chuẩn
      const tx = await signer.sendTransaction(result.data.transactionToSign);

      console.log("Đang gửi yêu cầu nhận thưởng. Tx Hash:", tx.hash);

      // Chờ giao dịch được xác nhận trên mạng lưới
      await tx.wait();

      // 3. (Tùy chọn) Cập nhật mã hash giao dịch vào DB qua API updateTicketHash của bạn
      await fetch(`http://localhost:3000/ticket/${ticketId}/hash`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account,
          hash: tx.hash,
        }),
      });

      return { success: true, hash: tx.hash };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Lỗi claim thưởng:", err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createLottery, buyTicket, drawWinner, claimReward, isPending };
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
