import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from './employeeSlice';

export const store = configureStore({
  reducer: {
    employees: employeeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
