import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import { useCountDownTimer } from './useCountDownTimer';

function App() {
  const [pipWindow, setPipWindow] = useState(null);
  const timerContainerRef = useRef(null);
  const { timeLeft, isRunning, startTimer, pauseTimer, resetTimer } =
    useCountDownTimer(60);

  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pipActive, setPipActive] = useState(false);

  useEffect(() => {
    if ('documentPictureInPicture' in window) {
      async function enterPiP() {
        const timer = timerRef.current;
        const timerContainer = timer.parentNode;
        timerContainer.classList.add('pip');

        const pipOptions = {
          initialAspectRatio: timer.clientWidth / timer.clientHeight,
          lockAspectRatio: true,
          copyStyleSheets: true,
        };

        const pipWindow = await window?.documentPictureInPicture?.requestWindow(
          pipOptions
        );

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules]
              .map((rule) => rule.cssText)
              .join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        pipWindow.document.body.append(timer);

        pipWindow.addEventListener('unload', onLeavePiP.bind(pipWindow), {
          once: true,
        });

        setPipWindow(pipWindow);
      }

      function onLeavePiP() {
        if (this !== pipWindow) {
          return;
        }

        const timer = pipWindow.document.querySelector('#timer');
        timerContainerRef.current.append(timer);
        timerContainerRef.current.classList.remove('pip');
        pipWindow.close();

        setPipWindow(null);
      }

      document.getElementById('popupbtn').addEventListener('click', () => {
        if (!pipWindow) {
          enterPiP();
        } else {
          onLeavePiP.bind(pipWindow)();
        }
      });
    } else {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;

      if (document.pictureInPictureEnabled || document.fullscreenEnabled) {
        document.body.appendChild(video);
        document.body.appendChild(canvas);
        canvas.id = 'canvas';
        const stream = canvas.captureStream();
        video.srcObject = stream;
        video.autoplay = false;
        video.controls = true;

        // video.addEventListener('play', () => {
        //   if (!roundInfo.running) pauseplay();
        // });
        // video.addEventListener('pause', () => {
        //   if (roundInfo.running) pauseplay();
        // });

        video.onenterpictureinpicture = () => {
          setPipActive(true);
          video.classList.add('pipactive');
        };
        video.onleavepictureinpicture = () => {
          if (document.fullscreenElement) return;
          setPipActive(false);
          video.classList.remove('pipactive');
        };
        video.onfullscreenchange = (ev) => {
          if (document.fullscreenElement) {
            setPipActive(true);
            video.classList.add('pipactive');
          } else {
            setPipActive(false);
            video.classList.remove('pipactive');
          }
        };

        document.getElementById('popupbtn').addEventListener('click', () => {
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            video.classList.remove('pipactive');
            return;
          }
          if (pipActive) {
            setPipActive(false);
            video.classList.remove('pipactive');
            return;
          }
          video.play();
          video.classList.add('pipactive');
          if (document.pictureInPictureEnabled) {
            video.requestPictureInPicture();
          }
          setPipActive(true);
        });
      } else {
        document.getElementById('popupbtn').style.display = 'none';
      }
    }
  }, [pipWindow, pipActive]);

  return (
    <div className='App'>
      <button id='popupbtn'>Toggle PiP</button>
      <div ref={timerContainerRef}>
        <div id='timer' ref={timerRef}>
          <div id='time'>{timeLeft}s</div>
          <div id='status'>
            <span id='s-focus'>FOCUS</span>
            <span id='s-short'>SHORT BREAK</span>
            <span id='s-long'>LONG BREAK</span>
          </div>
          <button
            id='pauseplay'
            className={isRunning ? 'playing' : 'paused'}
            onClick={isRunning ? pauseTimer : startTimer}
            title={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button onClick={resetTimer}>Reset</button>
        </div>
      </div>
    </div>
  );
}

export default App;
