import {
  Box,
  Container,
  Slide,
  Toolbar,
  Typography,
  Button,
  Fade,
} from "@mui/material";
import { useState } from "react";

import Message from "./components/Message";
import LivenessDetection from "./components/LivenessDetection";

function App() {
  const [step, setStep] = useState(0);

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
        <Message
          step={step}
          onClickStart={() => {
            setStep(2);
          }}
        />
        {step === 2 && <LivenessDetection />}
      </Container>
    </Box>
  );
}

export default App;
