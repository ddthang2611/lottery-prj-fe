export type ActiveLottery = {
    _id: string;
    type: number;
    totalBalance: number | string;
    endTime: string;
    startTime?: string;
    status?: number;
    address?: string;
};

export const ensureSepoliaNetwork = async () => {
    if (!window.ethereum) return;
    const sepoliaHexId = "0xaa36a7"; // 11155111 sang Hex

    const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
    });
    if (currentChainId !== sepoliaHexId) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: sepoliaHexId }],
            });
        } catch (switchError: unknown) {
            const err = switchError as { code: number };
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: sepoliaHexId,
                            chainName: "Sepolia Testnet",
                            rpcUrls: ["https://rpc.sepolia.org"],
                            nativeCurrency: {
                                name: "Sepolia ETH",
                                symbol: "SEP",
                                decimals: 18,
                            },
                            blockExplorerUrls: ["https://sepolia.etherscan.io"],
                        },
                    ],
                });
            } else {
                throw new Error(
                    "Vui lòng chuyển sang mạng Sepolia trên Metamask để tiếp tục.",
                );
            }
        }
    }
};

export const getActiveLotteries = async (
    type?: string | number,
): Promise<ActiveLottery[]> => {
    try {
        if (type) {
            const res = await fetch(
                `http://localhost:3000/lottery/active?type=${type}`,
            );
            const json = await res.json();
            return json.success ? json.data.items : [];
        }

        const [res1, res2] = await Promise.all([
            fetch(`http://localhost:3000/lottery/active?type=1`),
            fetch(`http://localhost:3000/lottery/active?type=2`),
        ]);

        const json1 = await res1.json();
        const json2 = await res2.json();

        let lotteries: ActiveLottery[] = [];
        if (json1.success) lotteries = [...lotteries, ...json1.data.items];
        if (json2.success) lotteries = [...lotteries, ...json2.data.items];

        return lotteries;
    } catch (error) {
        console.error("Lỗi fetch giải đấu:", error);
        return [];
    }
};
