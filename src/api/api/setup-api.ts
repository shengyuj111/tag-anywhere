import { Store } from "tauri-plugin-store-api";
import apiSlice from "../api-slice";

type SetupCommon = {
  indexPath: string;
  storehousePath: string;
};

export type StoreSetUpRequest = object & SetupCommon;
export type GetSetUpResponse = object & SetupCommon;
export type PathSetUp = object & SetupCommon;

export const setupApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSetupConfig: builder.query<GetSetUpResponse | null, void>({
      queryFn: async () => {
        const store = new Store(".settings.dat");
        const setup = await store.get<StoreSetUpRequest>("setup");
        return { data: setup };
      },
      providesTags: ["SETUP"],
    }),
    storeSetupConfig: builder.mutation<null, StoreSetUpRequest>({
      queryFn: async (setupBody: StoreSetUpRequest) => {
        const store = new Store(".settings.dat");
        await store.set("setup", setupBody);
        return { data: null };
      },
      invalidatesTags: ["SETUP"],
    }),
  }),
});

export const { useGetSetupConfigQuery, useStoreSetupConfigMutation } = setupApi;
