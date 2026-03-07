"use client"; // Bắt buộc phải có dòng này ở Next.js App Router khi dùng Hook

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../hooks/useWeb3';

export default function Home() {
  const { account, connectWallet, isConnecting, isChecking } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && account) {
      router.push('/buy-lottery');
    }
  }, [account, isChecking,  router]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isChecking) {
      return <main className="min-h-screen bg-slate-50 flex items-center justify-center">Đang tải...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-24">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Xổ Số Blockchain</h1>
        <p className="text-gray-500 mb-8">Minh bạch, công bằng, an toàn</p>

        {account ? (
          // Hiển thị trạng thái đang chuyển trang để UI không bị giật
          <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium border border-green-200 animate-pulse">
            Đã kết nối: {formatAddress(account)}
            <p className="text-sm mt-2 text-green-600">Đang vào hệ thống...</p>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              "Đang mở ví..."
            ) : (
              "🦊 Kết nối MetaMask"
            )}
          </button>
        )}
      </div>
    </main>
  );
}