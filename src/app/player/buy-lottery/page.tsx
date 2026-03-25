"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Clock, Wallet } from "lucide-react";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { Select } from "@/components/form/select"; 
import { CountdownTimer } from "@/components/ui/countdown";
import { useWeb3 } from "@/hooks/useWeb3";

import { usePlayerLottery } from "@/hooks/player/player-lottery";

import {
    getActiveLotteries,
    type ActiveLottery,
} from "@/hooks/lottery-service";

export default function BuyLotteryPage() {
    // ==========================================
    // 1. ROUTING & GLOBAL HOOKS
    // ==========================================
    const router = useRouter();
    const { account, isChecking } = useWeb3();

    const {
        buyTicket,
        claimReward,
        getMyTickets: fetchTicketsFromHook,
        isPendingPlayer: isPending,
    } = usePlayerLottery();

    const isClaimPending = isPending;

    // ==========================================
    // 2. STATES (Dữ liệu trang)
    // ==========================================

    interface Ticket {
        _id: string;
        wallet: string;
        ticket: number[];
        lottery: {
            lotteryId: string;
            type: number;
            address: string;
        };
        canClaim: boolean;
        isClaimed: boolean;
        createdAt: string;
    }

    const [activeLotteries, setActiveLotteries] = useState<ActiveLottery[]>([]);
    const [selectedLotteryId, setSelectedLotteryId] = useState<string>("none");
    const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);

    // ==========================================
    // 3. EFFECTS & FETCHERS
    // ==========================================
    const fetchLotteries = useCallback(async () => {
        setIsLoading(true);
        try {
            // Gọi service để lấy danh sách giải (giống như bên Admin)
            const items = await getActiveLotteries();

            if (items && items.length > 0) {
                // Sắp xếp ưu tiên giải kết thúc sớm nhất lên đầu
                const sortedItems = items.sort(
                    (a, b) =>
                        new Date(a.endTime).getTime() -
                        new Date(b.endTime).getTime(),
                );
                setActiveLotteries(sortedItems);

                // Tự động select giải đầu tiên nếu chưa chọn
                if (selectedLotteryId === "none") {
                    setSelectedLotteryId(sortedItems[0]._id);
                }
            } else {
                setActiveLotteries([]);
                setSelectedLotteryId("none");
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách giải:", error);
            setActiveLotteries([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLotteryId]);

    const fetchMyTickets = useCallback(async () => {
        if (!account) return;
        try {
            // Dùng hàm getMyTickets từ hook để giữ code sạch
            const tickets = await fetchTicketsFromHook(account);
            setMyTickets(tickets || []);
        } catch (error) {
            console.error("Lỗi fetch ticket:", error);
            setMyTickets([]);
        }
    }, [account, fetchTicketsFromHook]);

    useEffect(() => {
        if (!account) return;
        void fetchLotteries();
        void fetchMyTickets();
    }, [account, fetchLotteries, fetchMyTickets]);

    // Đặt lại mảng số đã chọn khi người dùng đổi giải đấu khác
    useEffect(() => {
        setSelectedNumbers([]);
    }, [selectedLotteryId]);

    // ==========================================
    // 4. EVENT HANDLERS & LOGIC
    // ==========================================
    const currentLottery = activeLotteries.find(
        (l) => l._id === selectedLotteryId,
    );

    // Xác định luật chơi dựa trên giải đấu đang chọn (Mặc định hiển thị Loại 1 nếu không có giải)
    const maxSelect = currentLottery?.type === 2 ? 3 : 5;
    const totalNumbers = currentLottery?.type === 2 ? 6 : 50;

    const handleToggleNumber = (num: number) => {
        if (!currentLottery) return;

        setSelectedNumbers((prev) => {
            if (prev.includes(num)) return prev.filter((n) => n !== num);
            if (prev.length < maxSelect)
                return [...prev, num].sort((a, b) => a - b);
            return prev;
        });
    };

    const handleBuyTicket = async () => {
        if (!account) return alert("Vui lòng kết nối ví Metamask!");
        if (!currentLottery)
            return alert("Vui lòng chọn một giải đấu để mua vé!");
        if (selectedNumbers.length !== maxSelect) {
            return alert(`Vui lòng chọn đủ ${maxSelect} số!`);
        }

        try {
            await buyTicket(account, currentLottery._id, selectedNumbers);
            alert(
                "Mua vé thành công! Bạn có thể xem vé trong mục Lịch Sử Vé Của Tôi.",
            );

            setSelectedNumbers([]);
            fetchLotteries();
            fetchMyTickets(); 
        } catch (error: unknown) {
            const err =
                error instanceof Error ? error : new Error(String(error));
            alert(err.message || "Giao dịch mua vé thất bại");
        }
    };

    const handleClaim = async (ticketId: string) => {
        if (!account) return alert("Vui lòng kết nối ví!");

        try {
            await claimReward(account, ticketId);
            alert(
                "🎉 Chúc mừng! Tiền thưởng đã được chuyển vào ví Metamask của bạn.",
            );
            fetchMyTickets();
        } catch (error: unknown) {
            const err =
                error instanceof Error ? error : new Error(String(error));
            alert(err.message || "Có lỗi xảy ra khi nhận thưởng.");
        }
    };
    // ==========================================
    // 5. RENDER HELPERS
    // ==========================================
    if (isChecking || !account) {
        return (
            <div className="min-h-screen flex items-center justify-center font-medium text-slate-500">
                Đang kiểm tra kết nối ví Metamask...
            </div>
        );
    }

    // Chuẩn bị options cho Select dropdown
    const lotteryOptions =
        activeLotteries.length > 0
            ? activeLotteries.map((l) => ({
                  label: `LOTTERY_${l._id.slice(-4).toUpperCase()} - Loại ${l.type} - Giải thưởng: ${ethers.formatEther(l.totalBalance.toString())} ETH`,
                  value: l._id,
              }))
            : [{ label: "Hiện không có giải nào đang mở", value: "none" }];

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
            <div className="max-w-6xl mx-auto">
                {/* ================= HEADER ================= */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Xổ Số Blockchain
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Minh bạch, công bằng, an toàn
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white text-slate-700"
                            onClick={() => router.push("/admin")}
                        >
                            Quản trị
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* ================= CỘT TRÁI (Form Mua Vé) ================= */}
                    <div className="lg:col-span-2 space-y-6">
                        <Board
                            title={
                                <>
                                    <Ticket className="w-5 h-5 inline mr-1 text-blue-600" />{" "}
                                    Mua Vé Số
                                </>
                            }
                        >
                            <p className="text-sm text-slate-500 mb-6">
                                Chọn vòng giải và các con số may mắn của bạn
                            </p>

                            <div className="mb-6 space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    Chọn vòng giải
                                </label>
                                <Select
                                    value={selectedLotteryId}
                                    onChange={setSelectedLotteryId}
                                    options={lotteryOptions}
                                />
                            </div>

                            {/* Bảng chọn số (Luôn hiển thị) */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-slate-700">
                                        Chọn {maxSelect} số từ 1-{totalNumbers}
                                    </label>
                                    <span className="text-sm font-medium text-slate-500">
                                        Đã chọn:{" "}
                                        <span className="text-slate-900 font-bold">
                                            {selectedNumbers.length}/{maxSelect}
                                        </span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 md:gap-3">
                                    {Array.from(
                                        { length: totalNumbers },
                                        (_, i) => i + 1,
                                    ).map((num) => {
                                        const isSelected =
                                            selectedNumbers.includes(num);
                                        const isDisabled = !currentLottery; // Khóa nút nếu không có giải

                                        return (
                                            <button
                                                key={num}
                                                disabled={isDisabled}
                                                onClick={() =>
                                                    handleToggleNumber(num)
                                                }
                                                className={`
                          aspect-square rounded-lg font-semibold text-sm transition-all border
                          ${
                              isDisabled
                                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-slate-800 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                          }
                        `}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hiển thị Giá & Nút Mua */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-6">
                                <span className="text-sm font-semibold text-slate-600">
                                    Giá vé:
                                </span>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-slate-900">
                                        10.0 Gwei
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        ≈ 0.00000001 ETH
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full py-6 text-base font-bold bg-slate-500 hover:bg-slate-600 text-white transition-all disabled:opacity-50"
                                onClick={handleBuyTicket}
                                disabled={
                                    isPending ||
                                    !currentLottery ||
                                    selectedNumbers.length !== maxSelect
                                }
                            >
                                {isPending
                                    ? "Đang xử lý giao dịch..."
                                    : "Mua Vé"}
                            </Button>
                        </Board>

                        {/* Khối Lịch Sử Vé (Giữ nguyên cấu trúc) */}
                        <Board
                            title={
                                <>
                                    <Clock className="w-5 h-5 inline mr-1 text-purple-600" />{" "}
                                    Lịch Sử Vé Của Tôi
                                </>
                            }
                        >
                            <div className="space-y-4">
                                {myTickets.length === 0 ? (
                                    <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                        Bạn chưa có vé nào
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {myTickets.map((ticket) => (
                                            <div
                                                key={ticket._id}
                                                className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                                                        <Ticket className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                            Vé #
                                                            {ticket._id
                                                                .slice(-6)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="flex gap-1 mt-1">
                                                            {ticket.ticket.map(
                                                                (
                                                                    n: number,
                                                                    idx: number,
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold rounded-full"
                                                                    >
                                                                        {n}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right mr-2">
                                                        <div className="text-[10px] text-slate-400">
                                                            Trạng thái
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500">
                                                            {ticket.isClaimed
                                                                ? "Đã nhận"
                                                                : "Chờ quay số"}
                                                        </div>
                                                    </div>
                                                    {/* Nút Nhận Thưởng tạm thời disable */}
                                                    <Button
                                                        disabled={
                                                            !ticket.canClaim ||
                                                            ticket.isClaimed ||
                                                            isClaimPending
                                                        }
                                                        className={`px-4 h-8 text-xs font-bold transition-all ${
                                                            ticket.canClaim &&
                                                            !ticket.isClaimed
                                                                ? "bg-green-600 text-white hover:bg-green-700 shadow-md"
                                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                        }`}
                                                        onClick={() =>
                                                            handleClaim(
                                                                ticket._id,
                                                            )
                                                        }
                                                    >
                                                        {isPending
                                                            ? "Đang xử lý..."
                                                            : ticket.isClaimed
                                                              ? "Đã nhận"
                                                              : "Nhận Thưởng Ngay"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Board>
                    </div>

                    {/* ================= CỘT PHẢI (Danh Sách Giải & Lịch Sử) ================= */}
                    <div className="space-y-6">
                        <Board
                            title={
                                <span className="font-bold text-slate-800">
                                    Giải Đang Diễn Ra
                                </span>
                            }
                        >
                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="text-center py-6 text-sm text-slate-400">
                                        Đang tải...
                                    </div>
                                ) : activeLotteries.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-slate-400">
                                        Chưa có giải nào đang hoạt động.
                                    </div>
                                ) : (
                                    activeLotteries.map((l) => {
                                        const balance = l.totalBalance
                                            ? l.totalBalance.toString()
                                            : "0";
                                        return (
                                            <div
                                                key={l._id}
                                                className="p-4 rounded-xl border border-blue-100 bg-blue-50/30"
                                            >
                                                <div className="font-bold text-slate-800 mb-1">
                                                    LOTTERY_
                                                    {l._id
                                                        .slice(-4)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="text-xs text-slate-500 mb-3">
                                                    Loại {l.type}
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 mb-1">
                                                            Giải thưởng:
                                                        </div>
                                                        <div className="font-bold text-blue-600 text-sm">
                                                            {ethers.formatEther(
                                                                balance,
                                                            )}{" "}
                                                            ETH
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                            <CountdownTimer
                                                                endTime={
                                                                    l.endTime
                                                                }
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1">
                                                            ngày : giờ : phút :
                                                            giây
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Board>

                        <Board
                            title={
                                <span className="font-bold text-slate-800">
                                    Lịch Sử Các Kỳ
                                </span>
                            }
                        >
                            <div className="space-y-4">
                                {/* Mock data cho giống thiết kế */}
                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="font-bold text-sm text-slate-800">
                                        LOTTERY_PAST_001
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 mb-3">
                                        Giải thưởng: 12.8 ETH
                                    </div>
                                    <div className="text-xs text-slate-600 mb-1">
                                        Số trúng giải:
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[5, 12, 23, 34, 45].map((n) => (
                                            <span
                                                key={n}
                                                className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 text-[10px] font-bold rounded"
                                            >
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="font-bold text-sm text-slate-800">
                                        LOTTERY_PAST_002
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 mb-3">
                                        Giải thưởng: 6.2 ETH
                                    </div>
                                    <div className="text-xs text-slate-600 mb-1">
                                        Số trúng giải:
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[2, 4, 6].map((n) => (
                                            <span
                                                key={n}
                                                className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 text-[10px] font-bold rounded"
                                            >
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Board>
                    </div>
                </div>
            </div>
        </div>
    );
}
