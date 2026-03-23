// src/hooks/usePlayerLottery.ts
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { ensureSepoliaNetwork } from "@/hooks/lottery-service";

export function usePlayerLottery() {
    const [isPending, setIsPending] = useState(false);

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
            const ticketPriceInWei = ethers.parseUnits("10", "gwei");

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
            throw error;
        } finally {
            setIsPending(false);
        }
    };

    const getMyTickets = async (account: string) => {
        try {
            const response = await fetch(
                `http://localhost:3000/ticket?walletAddress=${account.toLowerCase()}`,
            );
            const result = await response.json();
            
            if (result.success && result.data && Array.isArray(result.data.items)) {
                return result.data.items;
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
                throw new Error(
                    result.message || "Lỗi tạo giao dịch nhận thưởng",
                );
            if (!window.ethereum) throw new Error("Vui lòng cài đặt Metamask");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction(
                result.data.transactionToSign,
            );
            console.log("Đang xử lý nhận thưởng. Tx Hash:", tx.hash);
            await tx.wait();

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

    return { buyTicket, getMyTickets, claimReward, isPendingPlayer: isPending };
}
