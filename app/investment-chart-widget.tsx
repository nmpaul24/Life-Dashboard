import { getInvestmentHistory } from "@/lib/plaid";
import { Card } from "./card";
import InvestmentChart from "./investment-chart";

export default async function InvestmentChartWidget() {
  const history = await getInvestmentHistory();

  return (
    <Card
      title="Investment History"
      accentColor="bg-amber-400"
      glowRgb="251,191,36"
      className="h-full"
    >
      {history.length < 2 ? (
        <p className="text-sm text-white/40">
          Not enough history yet — this graphs your Roth IRA and brokerage
          balances once they&apos;ve been recorded for a couple of days.
        </p>
      ) : (
        <InvestmentChart data={history} />
      )}
    </Card>
  );
}
