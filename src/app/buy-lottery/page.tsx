"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

import { Select } from "@/components/form/select";

import { Ticket, History, ShieldCheck, Clock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { useWeb3 } from "../../hooks/useWeb3";

const PAST_LOTTERIES = [
  {
    id: "LOTTERY_PAST_001",
    prize: "12.8 ETH",
    winningNumbers: [5, 12, 23, 34, 45],
  },
  { id: "LOTTERY_PAST_002", prize: "6.2 ETH", winningNumbers: [2, 4, 6] },
];

const CountdownTimer = ({ endTime }: { endTime?: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    d: "00",
    h: "00",
    m: "00",
    s: "00",
  });

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ d: "00", h: "00", m: "00", s: "00" });
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24))
          .toString()
          .padStart(2, "0"),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          .toString()
          .padStart(2, "0"),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          .toString()
          .padStart(2, "0"),
        s: Math.floor((distance % (1000 * 60)) / 1000)
          .toString()
          .padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex gap-2">
      <span>{timeLeft.d}d</span>
      <span>{timeLeft.h}h</span>
      <span>{timeLeft.m}m</span>
      <span>{timeLeft.s}s</span>
    </div>
  );
};

export default function BuyLotteryPage() {
  const router = useRouter();
  const { account, isChecking, disconnectWallet } = useWeb3();

  type Lottery = {
    _id: string;
    type?: number;
    // totalBalance can be a string, number, or an object like BigNumber that implements toString()
    totalBalance?: string | number | { toString(): string } | null;
    endTime?: string;
  };

  const [activeLotteries, setActiveLotteries] = useState<Lottery[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState<boolean>(true);

  const [selectedLottery, setSelectedLottery] = useState<string>("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        setIsLoadingLotteries(true);
        const res = await fetch("http://localhost:3000/lottery/active?type=1");
        const json = await res.json();

        if (json.success && json.data.items) {
          setActiveLotteries(json.data.items);
          if (json.data.items.length > 0) {
            setSelectedLottery(json.data.items[0]._id);
          }
        }
      } catch (error) {
        console.error("Lỗi khi fetch giải đấu:", error);
      } finally {
        setIsLoadingLotteries(false);
      }
    };

    fetchLotteries();
  }, []);

  useEffect(() => {
    if (!isChecking && !account) {
      router.push("/");
    }
  }, [isChecking, account, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang đồng bộ dữ liệu ví...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang chuyển hướng về trang chủ...
      </div>
    );
  }

  const formatAddress = (address?: string) => {
    if (!address || address.length < 10) return address ?? "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleNumber = (num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 5) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const lotteryOptions = activeLotteries.map((lottery) => {
    const balance = lottery.totalBalance
      ? lottery.totalBalance.toString()
      : "0";
    const formattedPrize = ethers.formatEther(balance);
    const shortId = `LOTTERY_${lottery._id.slice(-4).toUpperCase()}`;

    return {
      label: `${shortId} - Giải thưởng: ${formattedPrize} ETH`,
      value: lottery._id,
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
              🎰 Xổ Số Blockchain
            </h1>
            <p className="text-slate-500 text-sm">
              Minh bạch, công bằng, an toàn
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/admin">
              <Button variant="secondary" className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Quản trị
              </Button>
            </Link>

            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
              {formatAddress(account)}
            </div>

            <Button
              variant="danger"
              onClick={disconnectWallet}
              className="flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Buy Lotteries & History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Mua Vé Số</h2>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">
                  Chọn vòng giải và các con số may mắn của bạn
                </p>

                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Chọn vòng giải
                </label>

                <Select
                  value={selectedLottery}
                  onChange={setSelectedLottery}
                  placeholder="Chọn vòng giải đang mở..."
                  options={lotteryOptions}
                  isLoading={isLoadingLotteries}
                  disabled={isLoadingLotteries || activeLotteries.length === 0}
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">
                    Chọn 5 số từ 1-50
                  </span>
                  <span className="text-sm font-medium">
                    {selectedNumbers.length}/5
                  </span>
                </div>

                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => {
                    const selected = selectedNumbers.includes(num);

                    return (
                      <button
                        key={num}
                        onClick={() => toggleNumber(num)}
                        className={
                          selected
                            ? "aspect-square rounded-lg text-sm font-medium bg-indigo-600 text-white transition-all scale-105"
                            : "aspect-square rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-indigo-50 transition-colors"
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 flex justify-between items-center mb-6">
                <span className="text-slate-600 font-medium">Giá vé</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-700">
                    10 Gwei
                  </div>
                  <div className="text-xs text-slate-500">≈ 0.00000001 ETH</div>
                </div>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={selectedNumbers.length !== 5 || !selectedLottery}
              >
                Mua Vé
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[200px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Lịch Sử Vé Của Tôi</h2>
              </div>

              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Bạn chưa có vé nào
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Board title="Giải Đang Diễn Ra">
              <div className="space-y-4">
                {isLoadingLotteries ? (
                  <div className="text-center text-sm text-slate-500 py-4">
                    Đang tải...
                  </div>
                ) : activeLotteries.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-4">
                    Không có giải nào đang mở
                  </div>
                ) : (
                  activeLotteries.map((lottery) => {
                    const balance = lottery.totalBalance
                      ? lottery.totalBalance.toString()
                      : "0";

                    return (
                      <div
                        key={lottery._id}
                        className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/30 transition-all hover:border-indigo-200"
                      >
                        <div className="font-medium">
                          LOTTERY_{lottery._id.slice(-4).toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-500 mb-3">
                          Loại {lottery.type || 1}
                        </div>

                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-slate-600">Giải thưởng</span>
                          <span className="font-bold text-indigo-600">
                            {ethers.formatEther(balance)} ETH
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          {lottery.endTime ? (
                            <CountdownTimer endTime={lottery.endTime} />
                          ) : (
                            <span>Đang cập nhật...</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Board>

            <Board title="Lịch Sử Các Kỳ">
              <div className="space-y-4">
                {PAST_LOTTERIES.map((lottery) => (
                  <div
                    key={lottery.id}
                    className="p-4 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <div className="font-medium">{lottery.id}</div>
                    <div className="text-sm text-slate-600 mb-3">
                      Giải thưởng: {lottery.prize}
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {lottery.winningNumbers.map((num) => (
                        <span
                          key={`${lottery.id}-${num}`}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Board>
          </div>
        </div>
      </div>
    </div>
  );
}
