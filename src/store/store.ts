import { apiSlice } from "@/api/api-slice";
import errorMiddleware from "@/api/middleware";
import { counterSlice } from "@/lib/counter/counterSlice";
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistStore,
} from "redux-persist";
import persistReducer from "redux-persist/lib/persistReducer";
import storage from "redux-persist/lib/storage";

export const persistConfig = {
  key: "root",
  storage,
  blacklist: ["counter"],
};

const rootReducer = combineReducers({
  [counterSlice.reducerPath]: persistReducer(
    {
      key: "counter",
      storage,
      blacklist: ["fetchStatus", apiSlice.reducerPath],
    },
    counterSlice.reducer,
  ),
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);
// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof persistedReducer>;

// `makeStore` encapsulates the store configuration to allow
// creating unique store instances, which is particularly important for
// server-side rendering (SSR) scenarios. In SSR, separate store instances
// are needed for each request to prevent cross-request state pollution.
export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== "production",
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of `rtk-query`.
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(apiSlice.middleware, errorMiddleware);
    },
  });
  return {
    store: store,
    persistor: persistStore(store),
  };
};

// Infer the return type of `makeStore`
export type AppStore = ReturnType<typeof makeStore>["store"];
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
