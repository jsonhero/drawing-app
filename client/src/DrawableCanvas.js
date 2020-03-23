import React, {useEffect, useRef, useState, useReducer} from 'react';
import {useStoreState} from 'easy-peasy';
import _ from 'lodash';
// http://cssdeck.com/labs/e6et3j1x/
const lineWidth = 5;

function midPointBtw(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
}

function drawLine(context, _points) {
  if (_points.length < 3) {
    const b = _points[0];
    context.beginPath();
    context.arc(b.x, b.y, context.lineWidth / 2, 0, Math.PI * 2, !0);
    context.fill();
    context.closePath();
    return;
  }

  let p1 = _points[0];
  let p2 = _points[1];

  context.beginPath();
  context.moveTo(p1.x, p1.y);

  for (let i = 1; i < _points.length - 2; i++) {
      let midPoint = midPointBtw(p1, p2);
      context.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = _points[i];
      p2 = _points[i+1];
  }

  // context.lineTo(p1.x, p1.y);
  context.quadraticCurveTo(
    _points[_points.length - 2].x,
    _points[_points.length - 2].y,
    _points[_points.length - 1].x,
    _points[_points.length - 1].y,
  );
  context.stroke();
}

function draw(context, _objects) {
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  for (let i = 0; i < _objects.length; i++) {
    const obj = _objects[i];
    context.fillStyle = obj.style.color;
    context.strokeStyle = obj.style.color;
    if (obj.type === 'line') {
      drawLine(context, obj['data']);
    }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_OBJECT':
      return 
    default:
      throw new Error()
  }
}

export default () => {
  const selectedColor = useStoreState(state => state.colorPicker.selectedColor);
  const canvasRef = useRef(null);
  const [isDrawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [objects, addObject] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (points.length) {
      draw(ctx, [...objects, {type: 'line', data: points, style: {color: selectedColor}}]);
    } else {
      draw(ctx, objects);
    }
  });

  const onMouseDown = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      setDrawing(true);
      setPoints([...points, {x: currentX, y: currentY}]);
  }

  const onMouseUp = () => {
      setDrawing(false);
      addObject([...objects, {type: 'line', data: points, style: {color: selectedColor}}])
      setPoints([]);
  }

  const onMouseMove = (e) => {
    if (isDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      let currentX = e.clientX - rect.left;
      let currentY = e.clientY - rect.top;
      setPoints([...points, {x: currentX, y: currentY}]);
    }
  }

  return <canvas
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseMove={_.throttle(onMouseMove, 10000)}
              ref={canvasRef}
              height={600}
              width={600}>
          </canvas>;
}