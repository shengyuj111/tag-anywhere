import { createSlice } from "@reduxjs/toolkit";

export const counterSlice = createSlice({
  name: "counter",
  initialState: {
    value: 0,
  },
  selectors: {
    selectCount: (counter) => counter.value,
  },
  reducers: {
    increament: (state, action) => {
      state.value += action.payload;
    },
    decrement: (state, action) => {
      state.value -= action.payload;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    setCount: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { increament, decrement, incrementByAmount, setCount } =
  counterSlice.actions;
export const { selectCount } = counterSlice.selectors;
