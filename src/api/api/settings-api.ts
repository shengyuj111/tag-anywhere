import { Store } from "tauri-plugin-store-api";
import apiSlice from "../api-slice";

export type GlobalSettings = {
  // setup settings
  indexPath: string | null;
  storehousePath: string | null;
  // video settings
  volume: number;
};

export type PartialGlobalSettings = Partial<GlobalSettings>;

const DEFAULT_SETTINGS: GlobalSettings = {
  indexPath: null,
  storehousePath: null,
  volume: 1,
};

export const getSettings = async () => {
  const store = new Store(".settings.dat");
  let setup = await store.get<GlobalSettings>("global-settings");
  if (!setup) {
    await store.set("global-settings", DEFAULT_SETTINGS);
  }
  setup = await store.get<GlobalSettings>("global-settings");
  console.log("getSettings", setup);
  return setup!;
};

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalSettings: builder.query<GlobalSettings | null, void>({
      queryFn: async () => {
        const settings = await getSettings();
        return { data: settings };
      },
      providesTags: ["SETTINGS"],
    }),
    setGlobalSettings: builder.mutation<null, PartialGlobalSettings>({
      queryFn: async (setupBody: PartialGlobalSettings) => {
        const store = new Store(".settings.dat");
        const existingSettings = await getSettings();
        const updatedSettings = {
          ...existingSettings,
          ...setupBody,
        };
        console.log(updatedSettings);
        await store.set("global-settings", updatedSettings);
        return { data: null };
      },
      invalidatesTags: ["SETTINGS"],
    }),
  }),
});

export const { useGetGlobalSettingsQuery, useSetGlobalSettingsMutation } =
  settingsApi;
