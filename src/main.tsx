import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import DocumentMeta from "react-document-meta";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const meta = {
  title: "DataHive",
  description: "A decentralized data collection platform.",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DocumentMeta {...meta}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </DocumentMeta>
  </React.StrictMode>
);
