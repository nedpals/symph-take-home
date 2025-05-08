import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();

import { asyncHandler } from "./utils";

const app = express();

// controllers
import { createShortURL, redirectToURL, getURLStats } from "./controllers/url_shortener.controller";
import { getURLMetadata } from "./controllers/url_metadata.controller";

// middleware
app.use(cors());
app.use(express.json());

/*
##################################################
||                                              ||
||            URL Metadata endpoints            ||
||                                              ||
##################################################
*/
app.get('/api/urls/metadata', asyncHandler(getURLMetadata));

/*
##################################################
||                                              ||
||            URL Shortener endpoints           ||
||                                              ||
##################################################
*/

app.post("/api/urls/shorten", asyncHandler(createShortURL));
app.get("/api/urls/:slug/stats", asyncHandler(getURLStats));
app.get("/:slug", asyncHandler(redirectToURL));


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});
