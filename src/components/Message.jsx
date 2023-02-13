import React from "react";
import { Box, Typography, Button, Fade } from "@mui/material";

const Message = ({ step, onClickStart }) => {
  return (
    <Fade
      in={true && step === 1}
      timeout={{ enter: 1500, exit: 0 }}
      unmountOnExit
    >
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h4">Instructions</Typography>
        <Typography color="text.secondary">
          In the next screen that appears, you will be given instructions
        </Typography>
        <Typography color="text.secondary">to move your face in a specific manner.</Typography>
        <Typography color="text.secondary" mb={5}>
          please rotate your face in clock-wise direction till you see the
          "Completed" Button.
        </Typography>
        <Button variant="contained" onClick={onClickStart}>
          Understood
        </Button>
      </Box>
    </Fade>
  );
};

export default Message;
