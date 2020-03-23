import React from 'react';
import {useStoreActions, useStoreState} from 'easy-peasy';

export default () => {
  const colors = useStoreState(state => state.colorPicker.colors);
  const selectedColor = useStoreState(state => state.colorPicker.selectedColor);
  const setColor = useStoreActions(actions => actions.colorPicker.setColor);

  return (
    <div style={{ display: 'flex', width: 500, backgroundColor: 'lightgrey'}}>
      {colors.map((color) => (
        <div key={color} style={
          { width: 50, height: 50, backgroundColor: color, border: (selectedColor === color) ? '1px solid grey': null}
        } onClick={() => setColor({color})}></div>
      ))}
    </div>
  );
};