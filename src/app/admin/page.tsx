"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  XCircle,
  Clock,
  Info,
  Wallet,
  // Settings2,
  BarChart2,
  ArrowLeft,
} from "lucide-react";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { Select } from "@/components/form/select";
import { CountdownTimer } from "@/components/ui/countdown";
import { useWeb3 } from "../../hooks/useWeb3";
import {
  useLottery,
  getActiveLotteries,
  type ActiveLottery,
} from "@/hooks/useLottery";

export default function AdminPage() {
  // ==========================================
  // 1. ROUTING & GLOBAL HOOKS
  // ==========================================
  const router = useRouter();
  const { account, isChecking } = useWeb3();
  const { createLottery, drawWinner, isPending } = useLottery();

  // ==========================================
  // 2. FORM STATES (Tạo giải mới)
  // ==========================================
  const [newLotteryId, setNewLotteryId] = useState("");
  const [oldLotteryId, setOldLotteryId] = useState("none");
  const [expireTime, setExpireTime] = useState("");
  const [lotteryType, setLotteryType] = useState("1");

  // ==========================================
  // 3. DATA FETCHING STATES (Danh sách giải)
  // ==========================================
  const [activeLotteries, setActiveLotteries] = useState<ActiveLottery[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState(true);

  // ==========================================
  // 4. EFFECTS & FETCHERS
  // ==========================================
  const fetchLotteries = useCallback(async () => {
    setIsLoadingLotteries(true);
    const items = await getActiveLotteries();

    const sortedItems = items.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
    );

    setActiveLotteries(sortedItems);
    setIsLoadingLotteries(false);
  }, []); // <-- Xóa lotteryType khỏi mảng dependency để tránh render lại danh sách khi đổi select form

  useEffect(() => {
    if (!account) return;
    fetchLotteries();
  }, [account, fetchLotteries]);

  // ==========================================
  // 5. EVENT HANDLERS
  // ==========================================
  const handleCreate = async () => {
    if (!account || !newLotteryId || !expireTime) {
      alert("Vui lòng nhập đầy đủ Mã vòng giải và Thời gian kết thúc!");
      return;
    }
    try {
      // Chuyển đổi thời gian từ input (datetime-local) sang Unix Timestamp (giây)
      const expiredTimestamp = Math.floor(
        new Date(expireTime).getTime() / 1000,
      );
      const prevId = oldLotteryId === "none" ? undefined : oldLotteryId;

      await createLottery(
        account,
        expiredTimestamp,
        Number(lotteryType),
        prevId,
      );

      alert("Khởi tạo giải đấu thành công trên Blockchain!");
      setNewLotteryId("");
      setExpireTime("");
      fetchLotteries();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Giao dịch thất bại");
    }
  };

  const handleDrawWinner = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn đóng giải đấu này để quay số? Thao tác này sẽ gọi VRF.",
      )
    )
      return;
    try {
      await drawWinner(account!, id);
      alert("Đã gửi yêu cầu đóng giải thành công!");
      fetchLotteries();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Lỗi khi đóng giải");
    }
  };

  // ==========================================
  // 6. RENDER HELPERS
  // ==========================================
  if (isChecking || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center font-medium text-slate-500">
        Đang kiểm tra kết nối ví Metamask...
      </div>
    );
  }

  const oldLotteryOptions = [
    { label: "Không kế thừa", value: "none" },
    ...activeLotteries.map((l) => ({
      label: `LOTTERY_${l._id.slice(-4).toUpperCase()}`,
      value: l._id,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* ========================================== */}
        {/* HEADER THEO ĐÚNG DESIGN                      */}
        {/* ========================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quản Trị Xổ Số
            </h1>
            <p className="text-slate-500 mt-1">Quản lý các vòng giải xổ số</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút 1: Trạng thái ví */}
            <div className="bg-slate-900 text-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>

            {/* Nút 2: Thống kê */}
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white text-slate-700"
            >
              <BarChart2 className="w-4 h-4" /> Thống kê
            </Button>

            {/* Nút 3: Người chơi */}
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white text-slate-700"
              onClick={() => router.push("/buy-lottery")}
            >
              <ArrowLeft className="w-4 h-4" /> Người chơi
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ========================================== */}
          {/* CỘT TRÁI (Tạo Giải + Danh Sách Đang Mở)    */}
          {/* ========================================== */}
          <div className="lg:col-span-2 space-y-8">
            <Board
              title={
                <>
                  <Plus className="w-5 h-5 inline mr-1 text-indigo-600" /> Tạo
                  Giải Mới
                </>
              }
            >
              <p className="text-sm text-slate-500 mb-6">
                Khởi tạo một vòng giải xổ số mới
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    ID Vòng Giải Mới *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="VD: LOTTERY_003"
                    value={newLotteryId}
                    onChange={(e) => setNewLotteryId(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400">
                    Định danh duy nhất cho vòng giải
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    ID Vòng Giải Cũ (tùy chọn)
                  </label>
                  <Select
                    value={oldLotteryId}
                    onChange={setOldLotteryId}
                    options={oldLotteryOptions}
                  />
                  <p className="text-[11px] text-slate-400">
                    Kế thừa cấu hình từ vòng cũ
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Thời Gian Hết Hạn *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 rounded-lg border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
                    value={expireTime}
                    onChange={(e) => setExpireTime(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400">
                    Thời điểm kết thúc bán vé
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    Loại Xổ Số *
                  </label>
                  <Select
                    value={lotteryType}
                    onChange={setLotteryType}
                    options={[
                      { label: "Loại 1: Chọn 5 số (1-50)", value: "1" },
                      { label: "Loại 2: Chọn 3 số (1-6)", value: "2" },
                    ]}
                  />
                  <p className="text-[11px] text-slate-400">
                    Quy tắc chơi của vòng giải
                  </p>
                </div>
              </div>

              {/* Xem trước cấu hình */}
              <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100/50">
                <h4 className="text-sm font-bold text-slate-700 mb-2">
                  Xem trước cấu hình:
                </h4>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-500">ID:</span>{" "}
                    {newLotteryId || "(chưa nhập)"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Loại:</span>{" "}
                    Chọn {lotteryType === "1" ? "5/50" : "3/6"}
                  </div>
                  <div className="w-full">
                    <span className="font-semibold text-slate-500">
                      Hết hạn:
                    </span>{" "}
                    {expireTime
                      ? new Date(expireTime).toLocaleString("vi-VN")
                      : "(chưa chọn)"}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full py-6 text-sm font-bold bg-slate-600 hover:bg-slate-700 text-white transition-all"
                  onClick={handleCreate}
                  disabled={isPending || !newLotteryId || !expireTime}
                >
                  {isPending ? "Đang xử lý giao dịch..." : "Khởi Động Giải Mới"}
                </Button>
              </div>
            </Board>

            <Board
              title={
                <span className="font-bold text-slate-800">
                  Quản Lý Giải Đang Hoạt Động
                </span>
              }
            >
              <p className="text-sm text-slate-500 mb-6">
                Đóng giải khẩn cấp hoặc kết thúc sớm
              </p>
              <div className="space-y-4">
                {isLoadingLotteries ? (
                  <div className="text-center py-10 text-slate-400">
                    Đang tải dữ liệu...
                  </div>
                ) : activeLotteries.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
                    Chưa có giải nào đang diễn ra.
                  </div>
                ) : (
                  activeLotteries.map((lottery) => {
                    const balance = lottery.totalBalance
                      ? lottery.totalBalance.toString()
                      : "0";
                    return (
                      <div
                        key={lottery._id}
                        className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="font-bold text-lg text-slate-800">
                              LOTTERY_{lottery._id.slice(-4).toUpperCase()}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              Loại {lottery.type} - Chọn{" "}
                              {lottery.type === 1 ? "5/50" : "3/6"}
                            </div>
                          </div>

                          <Button
                            variant="danger"
                            className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-6"
                            onClick={() => handleDrawWinner(lottery._id)}
                            disabled={isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Đóng giải
                          </Button>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Thời gian còn lại:
                            </div>
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <CountdownTimer endTime={lottery.endTime} />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">
                              Tổng giải thưởng:
                            </div>
                            <div className="text-lg font-bold text-indigo-600">
                              {ethers.formatEther(balance)} ETH
                            </div>
                          </div>
                        </div>

                        {/* Banner cảnh báo màu vàng y như Design */}
                        <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded border border-yellow-200">
                          <span className="font-bold">Lưu ý:</span> Đóng giải sẽ
                          kích hoạt Chainlink VRF để lấy số ngẫu nhiên. Hành
                          động này không thể hoàn tác.
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Board>
          </div>

          {/* ========================================== */}
          {/* CỘT PHẢI (Thống Kê + Lịch Sử + Hướng Dẫn)  */}
          {/* ========================================== */}
          <div className="space-y-6">
            {/* Box Thống Kê */}
            {/* Box Thống Kê */}
            <Board
              title={<span className="font-bold text-slate-800">Thống Kê</span>}
            >
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">
                    Giải đang hoạt động
                  </span>
                  {/* Tính tổng số giải lấy từ DB */}
                  <span className="text-2xl font-bold text-green-600">
                    {activeLotteries.length}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">
                    Giải đã kết thúc
                  </span>
                  {/* TODO: Lấy số này từ 1 API getInactiveLotteries khác từ DB */}
                  <span className="text-2xl font-bold text-blue-600">--</span>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-100 mt-4">
                  <div className="text-xs text-purple-600 mb-1">
                    Tổng giải thưởng đang chơi
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {/* Cộng dồn tổng Balance của tất cả các giải từ DB */}
                    {ethers.formatEther(
                      activeLotteries.reduce(
                        (sum, lot) => sum + BigInt(lot.totalBalance || 0),
                        BigInt(0),
                      ),
                    )}{" "}
                    ETH
                  </div>
                </div>
              </div>
            </Board>

            <Board
              title={
                <>
                  <Info className="w-5 h-5 text-indigo-500 inline mr-1" /> Hướng
                  Dẫn
                </>
              }
            >
              <ul className="text-sm space-y-4 text-slate-600">
                <li className="flex gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></div>
                  <span>
                    <strong className="font-semibold text-slate-900">
                      Tạo giải mới:
                    </strong>{" "}
                  </span>
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></div>
                  <span>
                    <strong className="font-semibold text-slate-900">
                      Đóng giải:
                    </strong>{" "}
                  </span>
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></div>
                  <span>
                    <strong className="font-semibold text-slate-900">
                      Chainlink VRF:
                    </strong>{" "}
                  </span>
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></div>
                  <span>
                    <strong className="font-semibold text-slate-900">
                      Cronjob:
                    </strong>{" "}
                  </span>
                </li>
              </ul>
            </Board>
          </div>
        </div>
      </div>
    </div>
  );
}
