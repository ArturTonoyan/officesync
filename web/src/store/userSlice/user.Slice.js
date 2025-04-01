import { createSlice } from "@reduxjs/toolkit";

const UserSlice = createSlice({
  name: "user",
  initialState: {
    user: {
      data: {},
    },
    editUser: {
      data: {},
    },
  },

  reducers: {
    setUserData(state, action) {
      const { data } = action.payload;
      state.user.data = data;
    },
  },
});

export const { setUserData } = UserSlice.actions;

export default UserSlice.reducer;
