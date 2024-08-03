type SetupCommon = {
  indexPath: string;
  storehousePath: string;
};

export type StoreSetUpRequest = object & SetupCommon;
export type GetSetUpResponse = object & SetupCommon;
export type PathSetUp = object & SetupCommon;
