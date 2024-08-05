import { createApi } from "@reduxjs/toolkit/query/react";

export const tags = ["SETUP", "TAG", "FILE", "LIBRARY"];

export const apiSlice = createApi({
  baseQuery: async () => {
    // Use rust query
    return { error: { status: "CUSTOM_LOGIC" } };
  },
  tagTypes: tags,
  endpoints: () => ({}),
});

export default apiSlice;
