import {createStore, action} from 'easy-peasy';

const store = createStore({
  colorPicker: {
    colors: ['red', 'blue', 'white'],
    selectedColor: 'red',
    setColor: action((state, payload) => {
      state.selectedColor = payload.color;
    }),
  },
  profile: {
    username: '',
    setUsername: action((state, payload) => {
      state.username = payload.username;
    }),
  }
});

export default store;
