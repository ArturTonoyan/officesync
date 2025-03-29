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
    emailSend: "",
    status: "idle", // idle | loading | succeeded | failed
    error: null,
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
