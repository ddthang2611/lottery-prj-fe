import { ethers } from "ethers";
import LotteryABI from "../contracts/lottery-abi.json";
import { LOTTERY_CONTRACT_ADDRESS } from "@/contracts/config";

export type ActiveLotteryOnChain = {
  _id: string;
  type: number;
  totalBalance: string;
  endTime: string;
  isActive: boolean;
};

export const getLatestLotteryOnChain =
  async (): Promise<ActiveLotteryOnChain | null> => {
    if (!window.ethereum) {
      console.warn("Metamask chưa được cài đặt");
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        LOTTERY_CONTRACT_ADDRESS,
        LotteryABI,
        provider,
      );

      const cycle = await contract.getLatestLottery();

      return {
        _id: cycle.id.replace("0x", ""),
        type: Number(cycle.types),
        totalBalance: cycle.totalBalances.toString(),
        endTime: new Date(Number(cycle.expired) * 1000).toISOString(),
        isActive: cycle.isActive,
      };
    } catch (error: unknown) {
      console.error(
        "Lỗi hoặc chưa có giải nào trên Contract:",
        (error as Error).message,
      );
      return null;
    }
  };
