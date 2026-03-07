"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  XCircle,
  BarChart3,
  Users,
  Clock,
  Info,
  Wallet,
} from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { Select } from "@/components/form/select";
import { CountdownTimer } from "@/components/ui/countdown";
import { useWeb3 } from "../../hooks/useWeb3";

export default function AdminPage() {
  const router = useRouter();
  const { account, isChecking } = useWeb3();

  // State cho Form Tạo Giải Mới
  const [newLotteryId, setNewLotteryId] = useState("none");
  const [oldLotteryId, setOldLotteryId] = useState("");
  const [expireTime, setExpireTime] = useState("");
  const [lotteryType, setLotteryType] = useState("1");

  type ActiveLottery = {
    _id: string;
    type: number;
    totalBalance: number | string;
    endTime: string;
    startTime?: string;
    status?: number;
    address?: string;
  };

  const [activeLotteries, setActiveLotteries] = useState<ActiveLottery[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState<boolean>(true);

  useEffect(() => {
    const fetchLotteries = async () => {
      try {
        setIsLoadingLotteries(true);
        // Gọi API với type đang chọn ở form để kế thừa cho chuẩn
        const res = await fetch(
          `http://localhost:3000/lottery/active?type=${lotteryType}`,
        );
        const json = await res.json();

        if (json.success && json.data.items) {
          setActiveLotteries(json.data.items);
        }
      } catch (error) {
        console.error("Lỗi khi fetch giải đấu:", error);
      } finally {
        setIsLoadingLotteries(false);
      }
    };

    fetchLotteries();
  }, [lotteryType]);

  // Xử lý chuyển hướng nếu chưa kết nối ví (bảo vệ route)
  useEffect(() => {
    if (!isChecking && !account) {
      router.push("/");
    }
  }, [isChecking, account, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang chuyển hướng...
      </div>
    );
  }

  const formatAddress = (address?: string) => {
    if (!address || address.length < 10) return address ?? "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const oldLotteryOptions = [
    { label: "Không kế thừa", value: "none" },
    ...activeLotteries.map((lottery) => ({
      label: `LOTTERY_${lottery._id.slice(-4).toUpperCase()}`,
      value: lottery._id,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
              Quản Trị Xổ Số
            </h1>
            <p className="text-slate-500 text-sm">
              Quản lý các vòng giải xổ số
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">
              <Wallet className="w-4 h-4" />
              {formatAddress(account)}
            </div>

            <Button variant="secondary" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </Button>

            <Link href="/buy-lottery">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-slate-300"
              >
                <Users className="w-4 h-4" />
                Người chơi
              </Button>
            </Link>
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI: FORM & DANH SÁCH GIẢI ĐANG CHẠY */}
          <div className="lg:col-span-2 space-y-6">
            {/* CARD 1: TẠO GIẢI MỚI */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Tạo Giải Mới</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Khởi tạo một vòng giải xổ số mới
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ID Vòng Giải Mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    placeholder="VD: LOTTERY_003"
                    value={newLotteryId}
                    onChange={(e) => setNewLotteryId(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Định danh duy nhất cho vòng giải
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ID Vòng Giải Cũ (tùy chọn)
                  </label>
                  <Select
                    value={oldLotteryId}
                    onChange={setOldLotteryId}
                    placeholder="Không kế thừa"
                    options={oldLotteryOptions}
                    isLoading={isLoadingLotteries}
                    disabled={isLoadingLotteries}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Kế thừa cấu hình từ vòng cũ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Thời Gian Hết Hạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                    value={expireTime}
                    onChange={(e) => setExpireTime(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Thời điểm kết thúc bán vé
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Loại Xổ Số <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={lotteryType}
                    onChange={setLotteryType}
                    options={[
                      { label: "Loại 1: Chọn 5 số (1-50)", value: "1" },
                      { label: "Loại 2: Chọn 3 số (1-6)", value: "2" },
                    ]}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Quy tắc chơi của vòng giải
                  </p>
                </div>
              </div>

              {/* Hộp Preview */}
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 mb-6">
                <h4 className="font-medium text-sm text-slate-700 mb-2">
                  Xem trước cấu hình:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    {newLotteryId || "(chưa nhập)"}
                  </div>
                  <div>
                    <span className="font-medium">Loại:</span> Chọn{" "}
                    {lotteryType === "1" ? "5/50" : "3/6"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Hết hạn:</span>{" "}
                    {expireTime
                      ? new Date(expireTime).toLocaleString("vi-VN")
                      : "(chưa chọn)"}
                  </div>
                </div>
              </div>

              <Button className="w-full bg-slate-600 hover:bg-slate-700 text-white">
                Khởi Động Giải Mới
              </Button>
            </div>

            {/* CARD 2: QUẢN LÝ GIẢI ĐANG HOẠT ĐỘNG */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">
                Quản Lý Giải Đang Hoạt Động
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Đóng giải khẩn cấp hoặc kết thúc sớm
              </p>

              <div className="space-y-4">
                <div className="space-y-4">
                  {isLoadingLotteries ? (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Đang tải danh sách...
                    </div>
                  ) : activeLotteries.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Không có giải nào đang hoạt động.
                    </div>
                  ) : (
                    activeLotteries.map((lottery) => {
                      const balance = lottery.totalBalance
                        ? lottery.totalBalance.toString()
                        : "0";
                      const formattedPrize = ethers.formatEther(balance);

                      return (
                        <div
                          key={lottery._id}
                          className="p-4 rounded-lg border border-purple-100 bg-purple-50/30"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-lg">
                                LOTTERY_{lottery._id.slice(-4).toUpperCase()}
                              </div>
                              <div className="text-sm text-slate-500">
                                Loại {lottery.type || 1} - Chọn{" "}
                                {lottery.type === 1 ? "5/50" : "3/6"}
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 h-auto text-sm flex items-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4" />
                              Đóng giải
                            </Button>
                          </div>

                          <div className="flex justify-between items-center py-3 border-b border-purple-100/50 mb-3">
                            <span className="text-sm text-slate-600">
                              Tổng giải thưởng:
                            </span>
                            <span className="font-bold text-purple-700">
                              {formattedPrize} ETH
                            </span>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-1">
                              Thời gian còn lại:
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium">
                              <Clock className="w-4 h-4 text-purple-500" />
                              {lottery.endTime ? (
                                <CountdownTimer endTime={lottery.endTime} />
                              ) : (
                                <span>Đang cập nhật...</span>
                              )}
                            </div>
                          </div>

                          <div className="bg-yellow-50 text-yellow-800 text-xs p-2.5 rounded border border-yellow-200 flex gap-2 items-start">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>
                              <span className="font-semibold">Lưu ý:</span> Đóng
                              giải sẽ kích hoạt Chainlink VRF để lấy số ngẫu
                              nhiên. Hành động này không thể hoàn tác.
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: SIDEBAR THỐNG KÊ & LỊCH SỬ */}
          <div className="space-y-6">
            {/* CARD: THỐNG KÊ */}
            <Board title="Thống Kê">
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-green-100 bg-green-50/50">
                  <div className="text-sm text-slate-600 mb-1">
                    Giải đang hoạt động
                  </div>
                  <div className="text-2xl font-bold text-green-600">2</div>
                </div>

                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                  <div className="text-sm text-slate-600 mb-1">
                    Giải đã kết thúc
                  </div>
                  <div className="text-2xl font-bold text-blue-600">2</div>
                </div>

                <div className="p-3 rounded-lg border border-purple-100 bg-purple-50">
                  <div className="text-sm text-slate-600 mb-1">
                    Tổng giải thưởng đang chơi
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    23.8 ETH
                  </div>
                </div>
              </div>
            </Board>

            {/* CARD: LỊCH SỬ GIẢI ĐÃ ĐÓNG
            <Board title="Lịch Sử Giải Đã Đóng">
              <div className="space-y-4">
                {MOCK_PAST_LOTTERIES.map((lottery) => (
                  <div key={lottery.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="font-medium">{lottery.id}</div>
                    <div className="text-xs text-slate-500 mb-1">{lottery.type} - Giải: {lottery.prize}</div>
                    <div className="text-xs text-slate-600 mb-2">Số trúng:</div>

                    <div className="flex gap-1.5 flex-wrap">
                      {lottery.winningNumbers.map((num) => (
                        <span key={`${lottery.id}-${num}`} className="w-7 h-7 flex items-center justify-center rounded-sm bg-green-100 text-green-700 text-xs font-semibold">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Board> */}

            {/* CARD: HƯỚNG DẪN */}
            <Board
              title={
                <>
                  <Info className="w-4 h-4 text-blue-500" /> Hướng Dẫn
                </>
              }
            >
              <div className="text-sm text-blue-900">
                <ul className="space-y-2 list-disc pl-4 marker:text-blue-400">
                  <li>
                    <strong className="font-semibold">
                      Tạo giải mới:
                    </strong>{" "}
                  </li>
                  <li>
                    <strong className="font-semibold">Đóng giải:</strong>
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Chainlink VRF:
                    </strong>{" "}
                  </li>
                  <li>
                    <strong className="font-semibold">Cronjob:</strong>
                  </li>
                </ul>
              </div>
            </Board>
          </div>
        </div>
      </div>
    </div>
  );
}
