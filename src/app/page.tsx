"use client"; // Bắt buộc phải có dòng này ở Next.js App Router khi dùng Hook

import { useWeb3 } from '../hooks/useWeb3';

export default function Home() {
  const { account, connectWallet, isConnecting } = useWeb3();

  // Hàm tiện ích cắt ngắn địa chỉ ví (VD: 0x1234...5678)
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-24">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">🎰 Xổ Số Blockchain</h1>
        <p className="text-gray-500 mb-8">Minh bạch, công bằng, an toàn</p>

        {account ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium border border-green-200">
            ✅ Đã kết nối: {formatAddress(account)}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-blue-300"
          >
            {isConnecting ? "Đang mở ví..." : "🦊 Kết nối MetaMask"}
          </button>
        )}
      </div>
    </main>
  );
}