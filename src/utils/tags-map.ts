import { constantCase } from 'change-case';

/**
 * Original Notion tags
 */
export const tagsMap: Record<string, string> = {
  'c9ec369a-9d75-4ba9-809c-cc5f6124b81e': 'Atlas Editor',
  'f11f1a49-3b02-4033-a968-78bdf7a28acb': 'UX',
  'aeaf955d-eb76-4d7f-8ac8-5a4e3276674e': 'Budget',
  '3ba8c72c-678f-40c5-86e6-33a3dfc57b02': 'BA Labs SH Commentary',
  '8885de51-b3b2-4dcf-b629-e646fcc67c54': 'AA - R&D',
  'aa8d745a-b152-4896-904a-2dc73a3c8f31': 'SubDAO Rewards',
  'a2a7a3c5-225c-4704-a651-f1c4ef26ca10': 'Edit Tracker',
  '4b67367f-be30-4c09-97c2-f8a57a143343': 'Numeric Value',
  '79a1c54a-de7a-4ebb-a5bd-5311a6432e8d': 'ML - 1:1 SH',
  'a8a999aa-04fc-4362-8f65-b67241407db3': 'Endgame Update',
  'f33452d9-6aff-4cac-a6dc-8f29ebb03932': 'SubDAO Incubation',
  '65dd9a6d-09d0-4189-afd3-86783ab8b881': 'Two-Stage Bridge',
  '3c7cf1df-435a-4131-8033-ed98fdcee0dd': 'NewChain',
  '6e4d6fdd-8b81-4810-81c4-2ef4659ed3bb': 'Purpose System',
  '13171676-93ff-4ee3-bfd5-7e1dc96bff88': 'CAIS',
  '47610f45-056c-40c8-ad90-5584dfaa8088': 'DAO Toolkit',
  'df2ee298-380f-4ce9-be6b-1135fce4e397': 'AVC',
  '4d2e5c20-d394-4160-a8e0-8042b4a480ce': 'Legacy Term - Use Approved',
  'bb07a48b-e9d3-4b98-8ef8-0cc5259b628d': 'Eco SH Commentary',
  'd34ab459-f810-492d-9a14-bfe8b9ccdf9c': 'P0 Hub Entry Needed',
  '0cfc1a24-20f1-45cd-a31a-3796001f4c8f': 'External Reference',
  'b1b3ed28-d7fa-43bf-a4e3-36cdf8591ae3': 'ML - Support. Docs Needed',
  '141324bc-0be4-4235-ad0b-670aedd0077b': 'ML - AA Owns',
  'f0695795-dc1a-4121-8540-3f8259ecbccb': 'ML - Move to P1',
  '4ad25884-dda7-469e-b493-620afd775af3': 'ML - Defer',
  'cd279acd-83c7-4a72-9483-68d1894cf1b0': 'ML - Low Priority',
  '06be0bb5-c6aa-4f98-9f57-9f13b233c9ea': 'ML -  Med Priority',
  '55b31929-b19d-4198-a0b0-5903fd703404': 'ML -  High Priority',
  '2a510760-297b-4101-9e26-85e935ce7b3b': 'Internal Reference',
  'af8a32aa-a0a3-4e87-83ac-0a9e853ceddc': 'v1 - MIP',
  '84fc7b12-7b84-4fb2-a81d-9fab6576ba44': 'GovFac SH Commentary',
  '7fc73c91-52c7-4f73-9ba7-818b2c75a688': 'AA - Onboarding Task',
  '91c551a4-aa54-44f1-b75d-07e257154db6': 'GovSec SH Commentary',
  '0fc0e2e9-f8a0-4d31-ad6e-6e01e5838674': 'Executive / Spell',
  'fa61c061-a192-4393-a024-3ec094680571': 'ECO Review Needed',
  'f4a51284-3d22-4054-85b6-53a73bf020da': 'Spark Review Needed',
  'dc658422-5b03-41f4-892e-18661187bc74': 'Steakhouse Review Needed',
  'ff9ecd43-6b28-4db1-85de-7c32737d8921': 'BA Labs Review Needed',
  'a70bd23f-ad6c-484a-96b7-b4a4251edab4': 'GovFac Review Needed',
  'c4220b58-613d-47aa-b8d2-cdda4cccb09e': 'GovSec Review Needed',
  '3584efbf-10e9-4839-b474-509ce1496532': 'Research Track',
  '6184aba5-ea49-4697-ab1f-dc724d947b02': 'Ecosystem Spell Validation',
  'f15f1b50-00c2-4301-9149-643c92aaa250': 'DssSpell Conformity',
  'ba592322-b71a-4b7d-af60-b20da2da5a92': 'Provenance',
  'edd768a8-d925-45d4-8063-d185c994088e': 'WIP',
  '76b294a4-6369-486f-90da-ff2f094621e0': 'Anon workforce',
  '57f5118c-fb68-4648-994d-586e689898be': 'Balance of Power',
  '25ba68db-6237-4aeb-a956-10c684eb912f': 'Recursive improvement',
  '3392975a-ce08-4f31-94e8-849752b93cc8': 'Ecosystem Intelligence',
  '9659b50a-b092-46e9-83ae-4307b5cfb5c0': 'Gov Security',
  'e258b54d-ebeb-4d5d-8091-aead3408d1c6': 'FacilitatorDAO',
  'db1dfb63-12d0-49ef-97fb-c267f1124def': 'Aligned Delegate',
  '87b2c458-2a14-44b0-8dd5-c2baa72e090d': 'Alignment Conserver',
  'de32a1aa-c4a7-496e-bc0a-18bf56cae0db': 'Doc Structure',
  '9c9a71c3-ae35-480d-a2b6-d9fdfb3654dd': 'Spirit of the Atlas',
  'c107e848-72a0-436e-8270-b307c5dd358f': 'Scope Advisor',
};

/**
 * Capitalized tags. Each tag is converted to constant case.
 */
export const capitalizedTagsMap: Record<string, string> = Object.fromEntries(
  Object.entries(tagsMap).map(([key, value]) => [key, constantCase(value)])
);

/**
 * Each tag record contains the original tag and its capitalized version.
 */
export const tagsRecords = Object.fromEntries(
  Object.entries(tagsMap).map(([key, value]) => [
    key,
    {
      original: value,
      capitalized: capitalizedTagsMap[key],
    },
  ])
);
