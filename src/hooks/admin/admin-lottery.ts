"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { ensureSepoliaNetwork } from "@/hooks/lottery-service";

export function useAdminLottery() {
    const [isPending, setIsPending] = useState(false);

    const createLottery = async (
        account: string,
        expiredTime: number,
        type: number,
        oldLotteryId?: string,
    ) => {
        setIsPending(true);
        try {
            await ensureSepoliaNetwork();
            const response = await fetch(
                "http://localhost:3000/lottery/active-new",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        walletAddress: account,
                        expiredTime: expiredTime,
                        type: type,
                        oldLotteryId: oldLotteryId || "",
                    }),
                },
            );

            const result = await response.json();
            if (!result.success)
                throw new Error(
                    result.message || "Không thể chuẩn bị giao dịch tạo giải",
                );
            if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tx = await signer.sendTransaction(
                result.data.transactionToSign,
            );

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
            throw error;
        } finally {
            setIsPending(false);
        }
    };

    const drawWinner = async (account: string, lotteryId: string) => {
        setIsPending(true);
        try {
            await ensureSepoliaNetwork();

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
            if (!result.success)
                throw new Error(
                    result.message || "Không thể chuẩn bị giao dịch đóng giải",
                );
            if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction(
                result.data.transactionToSign,
            );
            console.log("Đang gửi giao dịch đóng giải. Tx Hash:", tx.hash);
            await tx.wait();
            console.log(
                "Giao dịch thành công! Đang chờ Oracle (Chainlink VRF) quay số...",
            );

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
            const MAX_ATTEMPTS = 30;

            while (winningNumbers.length === 0 && attempts < MAX_ATTEMPTS) {
                attempts++;
                console.log(
                    `Đang dò kết quả trên chuỗi (Lần ${attempts}/${MAX_ATTEMPTS})...`,
                );
                await new Promise((resolve) => setTimeout(resolve, 10000));
                try {
                    const resultOnChain =
                        await contract.getLotteryResult(lotteryIdBytes);
                    if (resultOnChain && resultOnChain.length > 0) {
                        winningNumbers = resultOnChain.map((n: unknown) =>
                            Number(n),
                        );
                    }
                } catch (error: unknown) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    console.warn(err);
                }
            }

            if (winningNumbers.length === 0) {
                throw new Error(
                    "⏳ Quá thời gian chờ số ngẫu nhiên từ Chainlink.",
                );
            }

            console.log("🎉 ĐÃ CÓ KẾT QUẢ CHÍNH THỨC:", winningNumbers);

            await fetch(
                `http://localhost:3000/lottery/${lotteryId}/sync-result`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ result: winningNumbers }),
                },
            );

            return { success: true, hash: tx.hash, winningNumbers };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("❌ Lỗi quay số:", err);
            throw error;
        } finally {
            setIsPending(false);
        }
    };

    return { createLottery, drawWinner, isPendingAdmin: isPending };
}
