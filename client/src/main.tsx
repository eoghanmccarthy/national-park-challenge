import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add a title to the document
document.title = "NPS Rank - National Park Voting & Rankings";

// Create a meta description
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Vote and rank the best National Parks in the United States using our interactive ELO ranking system.';
document.head.appendChild(metaDescription);

// Add Open Sans and Montserrat fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap';
document.head.appendChild(fontLink);

createRoot(document.getElementById("root")!).render(<App />);
