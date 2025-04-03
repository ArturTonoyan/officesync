import { createSlice } from "@reduxjs/toolkit";

const ConvaSlice = createSlice({
  name: "conva",
  initialState: {
    objects: {
      data: [],
      selectedObject: {},
      selected: null,
    },
    offices: {
      data: [],
      selected: null,
      selectedObject: {},
    },
    floors: {
      data: [],
      selected: null,
      selectedObject: {},
    },
  },

  reducers: {
    setObjects(state, action) {
      const { data } = action.payload;
      state.objects.data = data;
    },
    setSelected(state, action) {
      state.objects.selected = action.payload;
      state.objects.selectedObject = state.objects.data.find(
        (obj) => obj.id === action.payload
      );
    },

    //! изменение выбранного обьекта
    setDataBySelected(state, action) {
      const { key, value } = action.payload;
      const newData = state.objects.data.map((object) => {
        if (object.id === state.objects.selected) {
          return {
            ...object,
            [key]: value,
          };
        }
        return object;
      });
      state.objects.data = newData;
    },

    //! изменение нескольких параметров обьекта
    setDataManyParams(state, action) {
      const { values } = action.payload;
      const newData = state.objects.data.map((object) => {
        if (object.id === state.objects.selected) {
          return {
            ...object,
            ...values,
          };
        }
        return object;
      });
      state.objects.data = newData;
      state.objects.selectedObject = {
        ...state.objects.selectedObject,
        ...values,
      };
    },

    //! изменение объекта по Id
    setDataParam(state, action) {
      const { key, value, id } = action.payload;
      const newData = state.objects.data.map((object) => {
        if (object.id === id) {
          return {
            ...object,
            [key]: value,
          };
        }
        return object;
      });
      state.objects.data = newData;
    },

    addObject(state, action) {
      const { data } = action.payload;
      console.log("data", data);
      const id = state.objects.data.length + 1;
      state.objects.data = [
        ...state.objects.data,
        { ...data, id: id, name: `Новый объект ${id}` },
      ].sort((a, b) => b.zIndex - a.zIndex);
    },

    deleteObject(state, action) {
      state.objects.data = state.objects.data.filter(
        (obj) => obj.id !== action.payload
      );
      state.objects.selected = null;
      state.objects.selectedObject = {};
    },
  },
});

export const {
  setUserData,
  setSelected,
  setDataBySelected,
  setDataManyParams,
  addObject,
  setDataParam,
  deleteObject,
} = ConvaSlice.actions;

export default ConvaSlice.reducer;
