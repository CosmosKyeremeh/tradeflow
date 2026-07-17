import { requireProfile } from "@/lib/auth";
import { AnalyticsBoard } from "./AnalyticsBoard";
import { analyticsSummary, clientActivity, dutyTotalsOverTime, topHsCodes, volumeOverTime } from "./queries";

export async function AnalyticsData() {
  const profile = await requireProfile();

  const [summary, volume, dutyByMonth, hsCodes, clients] = await Promise.all([
    analyticsSummary(profile.organizationId),
    volumeOverTime(profile.organizationId),
    dutyTotalsOverTime(profile.organizationId),
    topHsCodes(profile.organizationId),
    clientActivity(profile.organizationId),
  ]);

  return (
    <AnalyticsBoard
      summary={summary}
      volume={volume}
      dutyByMonth={dutyByMonth}
      hsCodes={hsCodes}
      clients={clients}
    />
  );
}
