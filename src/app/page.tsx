"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/hooks/useWeb3';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { account, connectWallet, isConnecting, isChecking } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && account) {
      router.push('/player');
    }
  }, [account, isChecking, router]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isChecking) {
      return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center font-medium">
          Đang kiểm tra kết nối...
        </main>
      );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-24">
      <div className="p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Xổ Số Blockchain</h1>
        <p className="text-slate-500 mb-8">Minh bạch, công bằng, an toàn</p>

        {account ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium border border-green-200 animate-pulse">
            Đã kết nối: {formatAddress(account)}
            <p className="text-sm mt-2 text-green-600">Đang vào hệ thống...</p>
          </div>
        ) : (
          // Gọi component Button, dùng đúng variant="primary" (hoặc bỏ trống vì nó là mặc định)
          // Chỉ truyền thêm class cấu trúc/layout vào className
          <Button
            variant="primary"
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full py-3 text-base"
          >
            {isConnecting ? "Đang gọi MetaMask..." : "Kết nối MetaMask"}
          </Button>
        )}
      </div>
    </main>
  );
}