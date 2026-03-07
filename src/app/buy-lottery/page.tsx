"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Select from "@radix-ui/react-select";
import {
  Ticket,
  History,
  ShieldCheck,
  ChevronDown,
  Check,
  Clock,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWeb3 } from "../../hooks/useWeb3";

const ACTIVE_LOTTERIES = [
  {
    id: "LOTTERY_001",
    type: 1,
    prize: "15.5 ETH",
    time: { d: "02", h: "23", m: "59", s: "02" },
  },
  {
    id: "LOTTERY_002",
    type: 2,
    prize: "8.3 ETH",
    time: { d: "04", h: "23", m: "59", s: "02" },
  },
];

const PAST_LOTTERIES = [
  {
    id: "LOTTERY_PAST_001",
    prize: "12.8 ETH",
    winningNumbers: [5, 12, 23, 34, 45],
  },
  { id: "LOTTERY_PAST_002", prize: "6.2 ETH", winningNumbers: [2, 4, 6] },
];

export default function BuyLotteryPage() {
  const router = useRouter();
  const { account, isChecking, disconnectWallet } = useWeb3();

  const [selectedLottery, setSelectedLottery] = useState("LOTTERY_001");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang đồng bộ dữ liệu ví...
      </div>
    );
  }

  if (!account) {
    router.push("/");
    return null;
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

  

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  value={round}
                  onChange={setRound}
                  placeholder="Select round"
                  options={[
                    { label: "Lottery_001", value: "1" },
                    { label: "Lottery_002", value: "2" },
                  ]}
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
                            ? "aspect-square rounded-lg text-sm font-medium bg-indigo-600 text-white"
                            : "aspect-square rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-indigo-50"
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
                  <div className="text-lg font-bold">10 Gwei</div>
                  <div className="text-xs text-slate-500">≈ 0.00000001 ETH</div>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={selectedNumbers.length !== 5}
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

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Giải Đang Diễn Ra</h3>

              <div className="space-y-4">
                {ACTIVE_LOTTERIES.map((lottery) => (
                  <div
                    key={lottery.id}
                    className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/30"
                  >
                    <div className="font-medium">{lottery.id}</div>
                    <div className="text-xs text-slate-500 mb-3">
                      Loại {lottery.type}
                    </div>

                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-600">Giải thưởng</span>
                      <span className="font-bold text-indigo-600">
                        {lottery.prize}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <div className="flex gap-2">
                        <span>{lottery.time.d}d</span>
                        <span>{lottery.time.h}h</span>
                        <span>{lottery.time.m}m</span>
                        <span>{lottery.time.s}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Lịch Sử Các Kỳ</h3>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
