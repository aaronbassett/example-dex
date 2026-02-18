"use client";

import type { TokenConfig } from "@midnight-dex/sdk";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenSelectorProps {
  tokens: TokenConfig[];
  selected: string;
  onSelect: (symbol: string) => void;
  disabled?: boolean;
}

/**
 * Dropdown for picking a token from the DEX config.
 * Shows the token symbol prominently with the full name as secondary text.
 */
export function TokenSelector({
  tokens,
  selected,
  onSelect,
  disabled = false,
}: TokenSelectorProps) {
  return (
    <Select value={selected} onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="w-[140px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.symbol} value={token.symbol}>
            <div className="flex items-center gap-2">
              <img
                src={`/tokens/${token.symbol.toLowerCase()}.svg`}
                alt={token.symbol}
                width={20}
                height={20}
              />
              <span className="font-semibold">{token.symbol}</span>
              <span className="text-xs text-gray-400">{token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
