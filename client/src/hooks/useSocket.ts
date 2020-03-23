import React, { useEffect } from 'react';
import io from 'socket.io-client';


// function useSocket() {
//     const socket = io('http://localhost:3000');

//     useEffect(() => {
//         socket.connect();
//     }, []);
// }