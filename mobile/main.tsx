import React from 'react';
import {createRoot} from 'react-dom/client';
import Page from '../app/page';
import '../app/globals.css';
import '../app/ambience.css';
import '../app/notes-polish.css';
import '../app/startup-splash.css';
createRoot(document.getElementById('root')!).render(<Page/>);
