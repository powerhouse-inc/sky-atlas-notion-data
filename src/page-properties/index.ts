import activeDataProperties from "./pages/activeData.json" with { type: "json" };
import annotationsProperties from "./pages/annotation.json" with { type: "json" };
import articlesProperties from "./pages/article.json" with { type: "json" };
import hubProperties from "./pages/hub.json" with { type: "json" };
import masterStatusProperties from "./pages/masterStatus.json" with { type: "json" };
import neededResearchProperties from "./pages/neededResearch.json" with { type: "json" };
import originalContextDataProperties from "./pages/originalContextData.json" with { type: "json" };
import scenariosProperties from "./pages/scenario.json" with { type: "json" };
import scenarioVariationsProperties from "./pages/scenarioVariation.json" with { type: "json" };
import scopesProperties from "./pages/scope.json" with { type: "json" };
import sectionsProperties from "./pages/section.json" with { type: "json" };
import agentProperties from "./pages/agent.json" with { type: "json" };
import tenetsProperties from "./pages/tenet.json" with { type: "json" };
import type { PagePropertiesList, PageName } from "../types/index.js";
import {
  ACTIVE_DATA,
  AGENT,
  ANNOTATION,
  ARTICLE,
  HUB,
  MASTER_STATUS,
  NEEDED_RESEARCH,
  ORIGINAL_CONTEXT_DATA,
  SCENARIO,
  SCENARIO_VARIATION,
  SCOPE,
  SECTION,
  TENET,
} from "../constants.js";

export const propertyIds: Record<PageName, string[]> = {
  [ACTIVE_DATA]: activeDataProperties.map((item) => item.id),
  [ANNOTATION]: annotationsProperties.map((item) => item.id),
  [ARTICLE]: articlesProperties.map((item) => item.id),
  [HUB]: hubProperties.map((item) => item.id),
  [MASTER_STATUS]: masterStatusProperties.map((item) => item.id),
  [NEEDED_RESEARCH]: neededResearchProperties.map((item) => item.id),
  [ORIGINAL_CONTEXT_DATA]: originalContextDataProperties.map((item) => item.id),
  [SCENARIO]: scenariosProperties.map((item) => item.id),
  [SCENARIO_VARIATION]: scenarioVariationsProperties.map((item) => item.id),
  [SCOPE]: scopesProperties.map((item) => item.id),
  [SECTION]: sectionsProperties.map((item) => item.id),
  [TENET]: tenetsProperties.map((item) => item.id),
  [AGENT]: agentProperties.map((item) => item.id),
};
