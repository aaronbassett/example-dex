import { SwapCard } from "@/components/swap-card";

export default function TradePage() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Swap tokens</h1>
        <p className="mt-1 text-sm text-gray-400">
          Trade between testnet tokens with zero-knowledge privacy
        </p>
      </div>
      <SwapCard />
    </div>
  );
}
