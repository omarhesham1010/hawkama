import type { ScenarioDecisionData } from '../../types/course';
import { DecisionSimulation } from './DecisionSimulation';

export function ScenarioDecisionActivity({
  data,
  onDone,
}: {
  data: ScenarioDecisionData;
  onDone: () => void;
}) {
  return <DecisionSimulation data={data} mode="both" onDone={onDone} />;
}
