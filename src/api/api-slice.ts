import { createApi } from "@reduxjs/toolkit/query/react";

export const tags = ["SETUP", "TAG", "TAG_LIST", "FILE", "FILE_LIST"];

export const apiSlice = createApi({
  baseQuery: async () => {
    // Use rust query
    return { error: { status: "CUSTOM_LOGIC" } };
  },
  tagTypes: tags,
  endpoints: () => ({}),
});

export default apiSlice;
