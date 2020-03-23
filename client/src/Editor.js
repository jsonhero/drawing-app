import React from 'react';

import DrawableCanvas from './DrawableCanvas';
import ColorPicker from './ColorPicker';


export default () => {
  return (
    <div style={{ background: 'black'}}>
      <DrawableCanvas />
      <ColorPicker />
    </div>
  );
}