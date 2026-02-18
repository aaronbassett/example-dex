import { TokenTable } from "@/components/token-table";

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Explore markets</h1>
        <p className="mt-1 text-sm text-gray-400">
          Click a pair to start trading
        </p>
      </div>
      <TokenTable />
    </div>
  );
}
