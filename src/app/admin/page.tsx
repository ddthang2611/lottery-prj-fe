// Đường dẫn file: app/admin/page.tsx
"use client";
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Màn hình Quản Trị (Admin)</h1>
      <p className="mb-8 text-gray-600">Nơi đây dùng để tạo giải xổ số mới, quay thưởng...</p>
      
      {/* Nút để quay về trang người chơi */}
      <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md">
        Quay lại trang Người chơi
      </Link>
    </div>
  );
}