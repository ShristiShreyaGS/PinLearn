import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";

import {
  persistStore,
  persistReducer
} from "redux-persist";

import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage
};

const persistedThemeReducer = persistReducer(
  persistConfig,
  themeReducer
);

export const store = configureStore({
  reducer: {
    theme: persistedThemeReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export const persistor = persistStore(store);