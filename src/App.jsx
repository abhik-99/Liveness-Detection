import {
  Box,
  Container,
  Slide,
  Toolbar,
  Typography,
  Button,
  Fade,
} from "@mui/material";
import { useRef, useState } from "react";

import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";

function App() {
  const [step, setStep] = useState(0);
  const canvasRef = useRef(null);
  const [tryAgain, setTryAgain] = useState(false);
  const [predictionStatus, setPredictionStatus] = useState({
    prevClass: "",
    currentClass: "",
  });
  const [currentPose, setCurrentPose] = useState('')
  const [verified, setVerified] = useState(false);

  console.log("Prediction Status", predictionStatus);
  const URL = import.meta.env.VITE_MODEL_URL;
  let model, webcam, ctx, labelContainer, maxPredictions;

  async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(300, 300, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = canvasRef.current;
    canvas.borderRadius = "50%";
    canvas.width = 300;
    canvas.height = 300;
    ctx = canvas.getContext("2d");
    // labelContainer = labelContainerRef.current;
    // for (let i = 0; i < maxPredictions; i++) {
    //   // and class labels
    //   labelContainer.appendChild(document.createElement("div"));
    // }
  }

  async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
  }

  async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    console.log("Prediction", prediction);
    console.log("Hello");

    const bestConfidentIndex = prediction
      .map(({ probability }) => probability.toFixed(2))
      .reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    const predictedClass = prediction[bestConfidentIndex];
    console.log("Predicted", predictedClass);

    if (predictedClass.probability.toFixed(2) > 0.7) {
      if (
        predictedClass.className === "Left Up" &&
        predictionStatus.currentClass === "Left Up"
      )
        setVerified(true);
      else if (
        predictionStatus.currentClass.length === 0 &&
        predictedClass.className === "Right Up"
      ) {
        setPredictionStatus({
          prevClass: "",
          currentClass: "Right Up",
        });
      } else if (
        predictedClass.className !== predictionStatus.currentClass &&
        predictionStatus.currentClass.length > 0
      ) {
        // Either the user goes through one complete loop or the cycle resets.
        if (
          predictedClass.className === "Right Down" &&
          predictionStatus.currentClass === "Right Up"
        ) {
          setPredictionStatus({
            prevClass: "Right Up",
            currentClass: "Right Down",
          });
        } else if (
          predictedClass.className === "Left Down" &&
          predictionStatus.currentClass === "Right Down"
        ) {
          setPredictionStatus({
            prevClass: "Right Down",
            currentClass: "Left Down",
          });
        } else if (
          predictedClass.className === "Left Up" &&
          predictionStatus.currentClass === "Left Down"
        ) {
          setPredictionStatus({
            prevClass: "Left Down",
            currentClass: "Left Up",
          });
        } else {
          setPredictionStatus({
            prevClass: "",
            currentClass: "",
          });
          setTryAgain(true);
        }
      }
    }

    setCurrentPose(predictedClass.className);
    // for (let i = 0; i < maxPredictions; i++) {
    //   const classPrediction =
    //     prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    //   labelContainer.childNodes[i].innerHTML = classPrediction;
    // }

    // finally draw the poses
    drawPose(pose);
  }

  function drawPose(pose) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
      }}
    >
      <Toolbar />
      <Container sx={{ overflow: "hidden" }}>
        <Slide in={true} direction="right" timeout={1500}>
          <Typography variant="h3">Welcome to</Typography>
        </Slide>
        <Slide in={true} direction="right" timeout={2000}>
          <Typography variant="h1">Zeno Verify</Typography>
        </Slide>
        <Fade
          in={true && step === 0}
          timeout={{ enter: 2500, exit: 0 }}
          onClick={() => setStep(1)}
          unmountOnExit
        >
          <Box sx={{ textAlign: "center", mt: 15 }}>
            <Button variant="contained" color="secondary">
              Get Started
            </Button>
          </Box>
        </Fade>
        <Fade
          in={true && step === 1}
          timeout={{ enter: 1500, exit: 0 }}
          onClick={() => setStep(2)}
          unmountOnExit
        >
          <Box sx={{ textAlign: "center", mt: 10 }}>
            <Typography>In the next screen that appears,</Typography>
            <Typography mb={5}>
              please rotate your face in clock-wise direction till all ticks are
              green ;)
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setStep(2);
                init();
              }}
            >
              Start Verification
            </Button>
          </Box>
        </Fade>
        {step === 2 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 5
              }}
            >
              <canvas ref={canvasRef}></canvas>
            </Box>
            {tryAgain && (
              <Typography align="center" mt={5}>
                Please Try Once more!
              </Typography>
            )}
            {
              verified &&
              <Typography align="center" mt={5}>
                Done!
              </Typography>
            }
            <Typography>Current: {currentPose}</Typography>
            <Typography>Validation Current: {predictionStatus.currentClass}</Typography>
            
            <Typography>Validation Previous: {predictionStatus.prevClass}</Typography>
            {/* <Box ref={labelContainerRef}></Box> */}
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
