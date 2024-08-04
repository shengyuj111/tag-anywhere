interface SetupCommon {
  indexPath: string;
  storehousePath: string;
}

export interface StoreSetUpRequest extends SetupCommon {}
export interface GetSetUpResponse extends SetupCommon {}
export interface PathSetUp extends SetupCommon {}
