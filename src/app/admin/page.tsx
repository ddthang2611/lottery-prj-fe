"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, XCircle, Clock, Info, Wallet, Settings2 } from "lucide-react";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { Select } from "@/components/form/select";
import { CountdownTimer } from "@/components/ui/countdown";
import { useWeb3 } from "../../hooks/useWeb3";
import { useLottery, getActiveLotteries, type ActiveLottery } from "@/hooks/useLottery";

export default function AdminPage() {
  const router = useRouter();
  const { account, isChecking } = useWeb3();
  const { createLottery, drawWinner, isPending } = useLottery();

  const [newLotteryId, setNewLotteryId] = useState("");
  const [oldLotteryId, setOldLotteryId] = useState("none");
  const [expireTime, setExpireTime] = useState("");
  const [lotteryType, setLotteryType] = useState("1");

  const [activeLotteries, setActiveLotteries] = useState<ActiveLottery[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState(true);

  // Gọi hàm fetch chung từ hook, truyền lotteryType để lọc
  const fetchLotteries = useCallback(async () => {
    setIsLoadingLotteries(true);
    const items = await getActiveLotteries(lotteryType);
    setActiveLotteries(items);
    setIsLoadingLotteries(false);
  }, [lotteryType]);

  useEffect(() => {
    if (!account) return;
    const timer = setTimeout(() => {
      void fetchLotteries();
    }, 0);
    return () => clearTimeout(timer);
  }, [account, fetchLotteries]);

  const handleCreate = async () => {
    if (!account || !newLotteryId || !expireTime) {
      alert("Vui lòng nhập đầy đủ Mã vòng giải và Thời gian kết thúc!");
      return;
    }
    try {
      await createLottery({ account, newLotteryId, oldLotteryId, expireTime, lotteryType });
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
    if (!confirm("Bạn có chắc chắn muốn đóng giải đấu này để quay số? Thao tác này sẽ gọi VRF.")) return;
    try {
      await drawWinner(account!, id);
      alert("Đã gửi yêu cầu đóng giải thành công!");
      fetchLotteries();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Lỗi khi đóng giải");
    }
  };

  if (isChecking || !account) return <div className="p-10 text-center font-medium">Đang kiểm tra kết nối ví Metamask...</div>;

  const oldLotteryOptions = [
    { label: "Không kế thừa", value: "none" },
    ...activeLotteries.map((l) => ({ label: `LOTTERY_${l._id.slice(-4).toUpperCase()}`, value: l._id })),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản Trị Hệ Thống</h1>
            <p className="text-slate-500 mt-1">Khởi tạo và điều hành các vòng quay xổ số</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-black/10 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <Button variant="outline" onClick={() => router.push("/buy-lottery")}>Giao diện người chơi</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-2 space-y-8">
            <Board title={<><Plus className="w-5 h-5 inline mr-1" /> Khởi Tạo Vòng Giải Mới</>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Mã Vòng Giải (Bắt buộc)</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ví dụ: LOTT_001" value={newLotteryId} onChange={(e) => setNewLotteryId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Kế thừa từ giải cũ</label>
                  <Select value={oldLotteryId} onChange={setOldLotteryId} options={oldLotteryOptions} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Thời gian kết thúc</label>
                  <input type="datetime-local" className="w-full px-4 py-2 rounded-lg border bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" value={expireTime} onChange={(e) => setExpireTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Loại hình xổ số</label>
                  <Select value={lotteryType} onChange={setLotteryType} options={[{ label: "Loại 1 (Chọn 5 từ 50)", value: "1" }, { label: "Loại 2 (Chọn 3 từ 6)", value: "2" }]} />
                </div>
              </div>

              {/* Xem trước cấu hình */}
              <div className="mt-6 p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4" /> Xem trước cấu hình
                </h4>
                <ul className="text-sm space-y-2 text-indigo-800">
                  <li><span className="font-medium inline-block w-28">Mã giải:</span> {newLotteryId || <span className="text-slate-400 italic">Chưa nhập</span>}</li>
                  <li><span className="font-medium inline-block w-28">Kế thừa ID:</span> {oldLotteryId === "none" ? "Không kế thừa" : oldLotteryId}</li>
                  <li><span className="font-medium inline-block w-28">Loại hình:</span> {lotteryType === "1" ? "Loại 1 (Chọn 5/50)" : "Loại 2 (Chọn 3/6)"}</li>
                  <li><span className="font-medium inline-block w-28">Hết hạn vào:</span> {expireTime ? new Date(expireTime).toLocaleString("vi-VN") : <span className="text-slate-400 italic">Chưa chọn</span>}</li>
                </ul>
              </div>

              <div className="mt-6">
                <Button className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCreate} disabled={isPending || !newLotteryId || !expireTime}>
                  {isPending ? "Đang chờ ví xác nhận..." : "Khởi Động Giải Mới Trên Blockchain"}
                </Button>
              </div>
            </Board>

            <Board title="Quản Lý Giải Đang Hoạt Động">
              <div className="space-y-4">
                {isLoadingLotteries ? (
                  <div className="text-center py-10 text-slate-400">Đang tải dữ liệu...</div>
                ) : activeLotteries.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">Chưa có giải nào đang diễn ra.</div>
                ) : (
                  activeLotteries.map((lottery) => {
                    const balance = lottery.totalBalance ? lottery.totalBalance.toString() : "0";
                    return (
                      <div key={lottery._id} className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="font-bold text-lg">LOTTERY_{lottery._id.slice(-4).toUpperCase()}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                            <span>Loại {lottery.type}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><CountdownTimer endTime={lottery.endTime} /></span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                          <div className="text-sm font-bold text-indigo-700">Giải thưởng: {ethers.formatEther(balance)} ETH</div>
                          <Button variant="danger" className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDrawWinner(lottery._id)} disabled={isPending}>
                            <XCircle className="w-4 h-4 mr-2" /> Đóng giải
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Board>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
            <Board title="Thống Kê Nhanh">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giải đang mở</div>
                  <div className="text-3xl font-bold mt-1 text-indigo-600">{activeLotteries.length}</div>
                </div>
              </div>
            </Board>

            <Board title={<><Info className="w-4 h-4 text-blue-500 inline mr-1" /> Hướng dẫn</>}>
              <ul className="text-sm space-y-3 list-disc pl-4 text-slate-700 marker:text-blue-400">
                <li><strong className="font-semibold text-slate-900">Tạo giải mới:</strong> Điền thông tin và khởi tạo vòng xổ số mới lên Blockchain.</li>
                <li><strong className="font-semibold text-slate-900">Đóng giải:</strong> Kết thúc việc mua vé và gọi hàm đóng giải trên Smart Contract.</li>
                <li><strong className="font-semibold text-slate-900">Chainlink VRF:</strong> Tự động được kích hoạt khi đóng giải để cung cấp số ngẫu nhiên minh bạch.</li>
              </ul>
            </Board>
          </div>
        </div>
      </div>
    </div>
  );
}