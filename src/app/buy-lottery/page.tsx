"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Ticket, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";
import { CountdownTimer } from "@/components/ui/countdown";
import { useWeb3 } from "../../hooks/useWeb3";
import { useLottery, getActiveLotteries, type ActiveLottery } from "@/hooks/useLottery";

export default function BuyLotteryPage() {
  const router = useRouter();
  const { account, isChecking } = useWeb3();
  const { buyTicket, isPending } = useLottery();

  const [tickets, setTickets] = useState<any[]>([]);
  const [activeLotteries, setActiveLotteries] = useState<ActiveLottery[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<ActiveLottery | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi hàm fetch chung từ hook, không truyền param để lấy tất cả các loại giải
  const fetchLotteries = async () => {
    setIsLoading(true);
    const items = await getActiveLotteries();
    setActiveLotteries(items);
    if (items.length > 0) {
      setSelectedLottery(items[0]);
      setSelectedNumbers([]);
    }
    setIsLoading(false);
  };



  
  useEffect(() => {
    if (!account) return;
    (async () => {
      await Promise.resolve();
      await fetchLotteries();
      setSelectedNumbers([]);
    })();
  }, [account, selectedLottery]); 

  const getLotteryRules = (type?: number) => {
    if (type === 1) return { maxSelect: 5, totalNumbers: 50 };
    if (type === 2) return { maxSelect: 3, totalNumbers: 6 };
    return { maxSelect: 0, totalNumbers: 0 };
  };

  const handleToggleNumber = (num: number) => {
    if (!selectedLottery) return;
    const rules = getLotteryRules(selectedLottery.type);

    setSelectedNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length < rules.maxSelect) return [...prev, num].sort((a, b) => a - b);
      return prev;
    });
  };

  const handleBuyTicket = async () => {
    if (!account) return alert("Vui lòng kết nối ví Metamask!");
    if (!selectedLottery) return alert("Vui lòng chọn một giải đấu!");

    const rules = getLotteryRules(selectedLottery.type);
    if (selectedNumbers.length !== rules.maxSelect) {
      return alert(`Vui lòng chọn đủ ${rules.maxSelect} số!`);
    }

    try {
      await buyTicket(account, selectedLottery._id, selectedNumbers);
      alert("Mua vé thành công! Chúc bạn may mắn!");
      setSelectedNumbers([]); 
      fetchLotteries(); 
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Giao dịch mua vé thất bại");
    }
  };
  
  if (isChecking || !account) return <div className="p-10 text-center font-medium">Đang kiểm tra kết nối ví Metamask...</div>;

  const rules = getLotteryRules(selectedLottery?.type);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mua Vé Xổ Số</h1>
            <p className="text-slate-500 mt-1">Chọn số may mắn và giành giải thưởng ETH</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-black/10 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
            <Button variant="outline" onClick={() => router.push("/admin")}>Trang Quản Trị</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-2 space-y-6">
            <Board title={<><Ticket className="w-5 h-5 mr-2 inline" /> Bảng Chọn Số</>}>
              {!selectedLottery ? (
                <div className="text-center py-10 text-slate-500">
                  {isLoading ? "Đang tải giải đấu..." : "Hiện tại không có giải đấu nào mở."}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div>
                      <div className="font-semibold text-indigo-900">Loại vé: Chọn {rules.maxSelect} số từ {rules.totalNumbers} số</div>
                      <div className="text-sm text-indigo-700 mt-1">Giá vé: <span className="font-bold">0.00000001 ETH</span> (10 Gwei)</div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{selectedNumbers.length} / {rules.maxSelect}</div>
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {Array.from({ length: rules.totalNumbers }, (_, i) => i + 1).map((num) => {
                      const isSelected = selectedNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          onClick={() => handleToggleNumber(num)}
                          className={`
                            h-12 rounded-full font-bold text-lg transition-all border-2
                            ${isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600"}
                          `}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t flex flex-col items-center">
                    <div className="mb-4 text-sm text-slate-500">Bộ số may mắn của bạn:</div>
                    <div className="flex gap-2 mb-6 min-h-[48px]">
                      {selectedNumbers.length === 0 && <span className="text-slate-400 italic">Chưa chọn số nào</span>}
                      {selectedNumbers.map((n) => (
                        <div key={n} className="w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-full border border-indigo-200">{n}</div>
                      ))}
                    </div>
                    <Button className="w-full md:w-2/3 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" onClick={handleBuyTicket} disabled={isPending || selectedNumbers.length !== rules.maxSelect}>
                      {isPending ? "Đang xử lý giao dịch..." : "Thanh Toán & Mua Vé Mới"}
                    </Button>
                  </div>
                </div>
              )}
            </Board>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
            <Board title="Chọn Giải Đang Mở">
              <div className="space-y-3">
                {activeLotteries.length === 0 && !isLoading && <div className="text-sm text-slate-500">Chưa có giải nào.</div>}
                {activeLotteries.map((lottery) => (
                  <div key={lottery._id} onClick={() => { setSelectedLottery(lottery); setSelectedNumbers([]); }} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLottery?._id === lottery._id ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-indigo-300"}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm">LOTT_{lottery._id.slice(-4).toUpperCase()}</div>
                      <div className="text-xs font-semibold px-2 py-1 bg-white rounded-md border text-slate-600">Loại {lottery.type}</div>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">
                      Tổng giải: <span className="font-bold text-indigo-600">{ethers.formatEther(lottery.totalBalance.toString())} ETH</span>
                    </div>
                    <div className="text-xs text-red-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Đóng sau: <CountdownTimer endTime={lottery.endTime} />
                    </div>
                  </div>
                ))}
              </div>
            </Board>

            <Board title={<><AlertCircle className="w-4 h-4 text-blue-500 inline mr-1" /> Thể lệ chơi</>}>
              <ul className="text-sm space-y-3 text-slate-700">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><b>Loại 1:</b> Chọn 5 số từ 1-50. Khớp tối thiểu 3 số để nhận thưởng.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><b>Loại 2:</b> Chọn 3 số từ 1-6. Khớp 100% để trúng giải độc đắc.</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><b>Phí giao dịch:</b> Mỗi lần mua bạn sẽ phải trả tiền vé (10 Gwei) kèm theo phí Gas của mạng lưới.</span></li>
              </ul>
            </Board>
          </div>
        </div>
      </div>
    </div>
  );
}