"use client";

import React, { useState, useEffect } from "react";

interface CountdownProps {
  endTime?: string;
}

export function CountdownTimer({ endTime }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ d: "00", h: "00", m: "00", s: "00" });
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, "0"),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, "0"),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0"),
        s: Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex gap-2">
      <span>{timeLeft.d} ngày</span>
      <span>{timeLeft.h} giờ</span>
      <span>{timeLeft.m} phút</span>
      <span>{timeLeft.s} giây</span>
    </div>
  );
}