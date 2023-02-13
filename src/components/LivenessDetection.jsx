import { Box, Typography, Button, Grow, Slide, Fade } from "@mui/material";
import { useRef, useState, useEffect } from "react";

import * as tf from "@tensorflow/tfjs";
import * as tmPose from "@teachablemachine/pose";

const NUM_TEST = 5;

const LivenessDetection = () => {
  const canvasRef = useRef(null);
  const positionRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [tryAgain, setTryAgain] = useState(false);
  const [predictionStatus, setPredictionStatus] = useState({
    prevClass: "",
    currentClass: "",
    allClasses: [],
  });
  const [currentPose, setCurrentPose] = useState("Loading...");
  positionRef.current = currentPose;
  const [verificationCount, setVerificationCount] = useState(0);

  const [verificationStarted, setVerificationStarted] = useState(false);

  // console.log("Prediction Status", predictionStatus);
  const URL = import.meta.env.VITE_MODEL_URL;
  let model, webcam, ctx;

  async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    if (!modelLoaded) {
      setPredictionStatus((prev) => ({
        ...prev,
        allClasses: model.getClassLabels(),
      }));
      setModelLoaded(true);
    }

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(300, 300, flip); // width, height, flip


    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 300;
    ctx = canvas.getContext("2d");
  }

  async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    if (verificationCount <= NUM_TEST) window.requestAnimationFrame(loop);
  }

  async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    // console.log("Prediction", prediction);
    // console.log("Hello");

    const bestConfidentIndex = prediction
      .map(({ probability }) => probability.toFixed(2))
      .reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    const predictedClass = prediction[bestConfidentIndex];
    // console.log("Predicted", predictedClass);

    if (predictedClass.className === positionRef.current) {
      if (verificationCount === NUM_TEST - 1) webcam.stopStreamedVideo();
      setVerificationCount((prev) => prev + 1);
    }

    if (predictedClass.className !== predictionStatus.currentClass) {
      setPredictionStatus((prev) => ({
        ...prev,
        prevClass: prev.currentClass,
        currentClass: predictedClass.className,
      }));
    }

    ctx.drawImage(webcam.canvas, 0, 0);
  }

  const startVerification = () => {
    setVerificationStarted(true);
    init();
  };

  useEffect(() => {
    if (modelLoaded) {
      const random = Math.floor(
        Math.random() * predictionStatus.allClasses.length
      );
      setCurrentPose(predictionStatus.allClasses[random]);
      console.log("Current Pose", predictionStatus.allClasses[random]);
      console.log(
        Array.from({ length: verificationCount }, (value, index) => index)
      );
    }
  }, [verificationCount, modelLoaded]);

  if (!verificationStarted && !modelLoaded) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <Fade in={true} unmountOnExit timeout={1000}>
          <Button
            onClick={startVerification}
            variant="contained"
            color="secondary"
          >
            Start
          </Button>
        </Fade>
      </Box>
    );
  } else if (verificationStarted && !modelLoaded) {
    return (
      <Typography variant="h5" align="center" mt={5}>
        Loading...
      </Typography>
    );
  } else if (verificationCount < NUM_TEST && modelLoaded) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            mt: 5,
          }}
        >
          {
            verificationCount === 0 &&
            <Typography color="text.secondary">
              Please wait for the camera to appear on screen and then
            </Typography>
          }
          <Typography mb={2}>
            Please Turn your face to {currentPose} position.
          </Typography>
          <canvas ref={canvasRef} style={{ borderRadius: "50%" }}></canvas>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>Verification Count: {verificationCount}</Typography>
            {/* {Array.from(
              { length: verificationCount },
              (value, index) => index
            ).map((v) => {
              <Typography>✅</Typography>;
            })} */}
          </Box>
        </Box>
      </>
    );
  } else {
    return (
      <Box>
        <Slide in={true} direction="right" timeout={1500}>
          <Typography variant="h3" color="green">
            Done!
          </Typography>
        </Slide>
        <Box
          sx={{
            mt: 5,
            textAlign: "center",
          }}
        >
          <Fade in={true} timeout={2500}>
            <Button variant="contained" onClick={() => {setVerificationCount(0); init()}}>Re-Try</Button>
          </Fade>
        </Box>
      </Box>
    );
  }
};

export default LivenessDetection;
