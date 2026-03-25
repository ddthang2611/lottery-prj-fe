import Link from "next/link";
import { Ticket, ShoppingBag } from "lucide-react";

// Import đúng các component UI của bạn
import { Button } from "@/components/ui/button";
import { Board } from "@/components/ui/board";

export default function PlayerPortalPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900">
            <div className="max-w-6xl mx-auto">
                {/* HEADER CỦA PORTAL */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            Trung Tâm Người Chơi
                        </h1>
                        <p className="text-slate-500">
                            Chào mừng bạn tham gia Hệ thống Xổ số Blockchain
                            minh bạch.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Dùng Button outline của bạn để làm nút quay lại Admin */}
                        <Link href="/admin">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 bg-white text-slate-700 shadow-sm"
                            >
                                Quản trị
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="group h-full">
                        <Board
                            title={
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <ShoppingBag className="w-6 h-6 hover-" />
                                    </div>
                                    <span className="font-bold text-slate-800">
                                        Mua Vé Mới
                                    </span>
                                </div>
                            }
                        >
                            <div className="flex flex-col justify-between h-full pt-2">
                                <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                                    Lựa chọn những con số may mắn của riêng bạn
                                    và tham gia vào các vòng quay xổ số minh
                                    bạch trên Blockchain Sepolia Testnet.
                                </p>
                                <Link href="/player/buy-lottery">
                                    <Button className="w-full py-6 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-lg">
                                        Đi tới Sảnh Mua Vé
                                    </Button>
                                </Link>
                            </div>
                        </Board>
                    </div>

                    <div className="group h-full">
                        <Board
                            title={
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-slate-800">
                                        Quản Lý Vé & Nhận Thưởng
                                    </span>
                                </div>
                            }
                        >
                            <div className="flex flex-col justify-between h-full pt-2">
                                <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                                    Xem lại lịch sử tất cả các vé bạn đã từng
                                    mua. Dò kết quả trúng thưởng và thực hiện
                                    rút tiền thưởng về ví (Claim Reward) khi
                                    vòng giải kết thúc.
                                </p>
                                {/* Dùng Button outline của bạn cho chức năng thứ 2 */}
                                <Link href="/player/my-tickets">
                                    <Button
                                        variant="outline"
                                        className="w-full py-6 text-sm font-bold border-2 border-slate-300 hover:border-blue-300 hover:bg-blue-50 text-slate-800 transition-colors"
                                    >
                                        Kiểm tra Lịch sử Vé
                                    </Button>
                                </Link>
                            </div>
                        </Board>
                    </div>
                </div>
            </div>
        </div>
    );
}
