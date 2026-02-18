"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PairData {
  from: string;
  to: string;
  pair: string;
  price: string;
  change24h: number;
  volume: string;
}

/**
 * Mock market data for the three supported pairs.
 * In production this would come from an indexer or price oracle.
 */
const PAIRS: PairData[] = [
  {
    from: "tMIDN",
    to: "tUSDC",
    pair: "tMIDN / tUSDC",
    price: "1,800.00",
    change24h: 3.42,
    volume: "$2.4M",
  },
  {
    from: "tBTC",
    to: "tUSDC",
    pair: "tBTC / tUSDC",
    price: "67,500.00",
    change24h: -1.18,
    volume: "$8.1M",
  },
  {
    from: "tBTC",
    to: "tMIDN",
    pair: "tBTC / tMIDN",
    price: "37.50",
    change24h: 0.85,
    volume: "$1.2M",
  },
];

/** Table showing available trading pairs with mock market data. */
export function TokenTable() {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--glass-border)] text-left text-gray-400">
            <th className="px-6 py-4 font-medium">Pair</th>
            <th className="px-6 py-4 font-medium">Price</th>
            <th className="px-6 py-4 font-medium">24h Change</th>
            <th className="px-6 py-4 font-medium">Volume</th>
          </tr>
        </thead>
        <tbody>
          {PAIRS.map((pair) => (
            <tr
              key={pair.pair}
              onClick={() =>
                router.push(`/trade?from=${pair.from}&to=${pair.to}`)
              }
              className="cursor-pointer border-b border-[var(--glass-border)] transition-colors last:border-b-0 hover:bg-[var(--midnight-700)]"
            >
              <td className="px-6 py-4 font-medium text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={`/tokens/${pair.from.toLowerCase()}.svg`}
                    alt={pair.from}
                    width={20}
                    height={20}
                  />
                  {pair.pair}
                </div>
              </td>
              <td className="px-6 py-4 text-white">{pair.price}</td>
              <td
                className={cn(
                  "px-6 py-4 font-medium",
                  pair.change24h >= 0
                    ? "text-[var(--teal)]"
                    : "text-[var(--red)]",
                )}
              >
                {pair.change24h >= 0 ? "+" : ""}
                {pair.change24h.toFixed(2)}%
              </td>
              <td className="px-6 py-4 text-gray-300">{pair.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
