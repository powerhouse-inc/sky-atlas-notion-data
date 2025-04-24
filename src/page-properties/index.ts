import activeDataProperties from "./pages/activeData.json" with { type: "json" };
import annotationsProperties from "./pages/annotation.json" with { type: "json" };
import articlesProperties from "./pages/article.json" with { type: "json" };
import masterStatusProperties from "./pages/masterStatus.json" with { type: "json" };
import neededResearchProperties from "./pages/neededResearch.json" with { type: "json" };
import originalContextDataProperties from "./pages/originalContextData.json" with { type: "json" };
import scenariosProperties from "./pages/scenario.json" with { type: "json" };
import scenarioVariationsProperties from "./pages/scenarioVariation.json" with { type: "json" };
import scopesProperties from "./pages/scope.json" with { type: "json" };
import sectionsProperties from "./pages/section.json" with { type: "json" };
import agentProperties from "./pages/agent.json" with { type: "json" };
import tenetsProperties from "./pages/tenet.json" with { type: "json" };
import type { PageName } from "../types/index.js";
import {
  ACTIVE_DATA,
  AGENT,
  ANNOTATION,
  ARTICLE,
  MASTER_STATUS,
  NEEDED_RESEARCH,
  ORIGINAL_CONTEXT_DATA,
  SCENARIO,
  SCENARIO_VARIATION,
  SCOPE,
  SECTION,
  TENET,
} from "../constants.js";

export const pageProperties: Record<PageName, {
  name: string;
  type: string;
  id: string;
}[]> = {
  [ACTIVE_DATA]: activeDataProperties,
  [ANNOTATION]: annotationsProperties,
  [ARTICLE]: articlesProperties,
  [MASTER_STATUS]: masterStatusProperties,
  [NEEDED_RESEARCH]: neededResearchProperties,
  [ORIGINAL_CONTEXT_DATA]: originalContextDataProperties,
  [SCENARIO]: scenariosProperties,
  [SCENARIO_VARIATION]: scenarioVariationsProperties,
  [SCOPE]: scopesProperties,
  [SECTION]: sectionsProperties,
  [TENET]: tenetsProperties,
  [AGENT]: agentProperties,
};
