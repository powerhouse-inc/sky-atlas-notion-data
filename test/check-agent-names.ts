import { makeViewNodeTitleText, type ViewNodeMap, type TProcessedSectionsById } from "../src/index.js";

const agentText = await Bun.file('./data/processed/agent.json').text();
const agentArtifactIds =[ "1c2f2ff0-8d73-814b-8781-cea8e915bc69",
  "1c2f2ff0-8d73-8188-bf97-d410d70b9c8c", "1c1f2ff0-8d73-819a-a99a-c7d8be6973e2",
  "1c1f2ff0-8d73-8157-a4b8-f568e2f09fe3"
]
const skyPrimitiveListIds = [ "1c2f2ff0-8d73-8192-b824-f4d717c6b46c",
  "1c2f2ff0-8d73-8122-8444-c93a8b24ea83", "1c1f2ff0-8d73-811a-b047-d623f8fa220b",
  "1c1f2ff0-8d73-81bb-be7f-f9684974185c"
]
const primitiveIds = [
  "1c2f2ff0-8d73-814d-98e8-e6bc3f37ff57", "1c2f2ff0-8d73-81da-ba8c-d0fe14fc26a2",
  "1c2f2ff0-8d73-8139-a7b2-f443be48a0f1", "1c2f2ff0-8d73-814b-a8e3-fa9b8a089740",
  "1c2f2ff0-8d73-81ae-b222-dbc9d4d7377c", "1c2f2ff0-8d73-81b5-a35c-c2d3d4a0039c",
  "1c2f2ff0-8d73-819f-bcbb-ce8ed7822117", "1c2f2ff0-8d73-81b9-914b-e55e3282407e",
  "1c2f2ff0-8d73-8191-87c9-ff02b0bd03f9", "1c2f2ff0-8d73-8193-a447-e6a8059ce866",
  "1c2f2ff0-8d73-81f2-8371-fa90b5e8061b", "1c2f2ff0-8d73-8186-b2e9-ea0bdbb36f24",
  "1c2f2ff0-8d73-81be-ac3b-e19efdd01eab", "1c2f2ff0-8d73-81d7-95d0-f80e2943117c",
  "1c1f2ff0-8d73-815f-a990-c41e43a155ef", "1c1f2ff0-8d73-81a6-b552-c7ed95a80da2",
  "1c1f2ff0-8d73-8110-98bc-d867c8e6675c", "1c1f2ff0-8d73-81bf-8891-c4d53607a0df",
  "1c1f2ff0-8d73-8197-bdb7-ece621bb35a2", "1c1f2ff0-8d73-81a6-be9d-cfba1f2d0ca8",
  "1c1f2ff0-8d73-8166-9e08-cb8eff3945ad", "1c1f2ff0-8d73-81ba-ba67-c3cb4624f5ff",
  "1c1f2ff0-8d73-81b8-8990-d6040ffa95c7", "1c1f2ff0-8d73-81ae-a7f5-c19bdc686795",
  "1c1f2ff0-8d73-81aa-a6b0-fc75761d47db", "1c1f2ff0-8d73-81e9-9c4c-c58913fbf4c7",
  "1c1f2ff0-8d73-81e5-808b-d2c7e6bdc8b9", "1c1f2ff0-8d73-810f-9f22-ecef854c353e"
]
const agent = JSON.parse(agentText) as TProcessedSectionsById;
const agentIds = Object.keys(agent);

const viewNodeMapText = await Bun.file('./data/view-node-map.json').text();
const viewNodeMap = JSON.parse(viewNodeMapText) as ViewNodeMap;

const agentNodes = Object.values(viewNodeMap).filter(node => agentArtifactIds.includes(node?.id ?? "") || skyPrimitiveListIds.includes(node?.id ?? "") || primitiveIds.includes(node?.id ?? "")).filter(node => node !== undefined).map(node => makeViewNodeTitleText(node));

console.log(agentNodes);
