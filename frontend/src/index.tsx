import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import CompanyPage from './CompanyPage';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App /> } />
            <Route path="/:ticker" element={<CompanyPage />} />
        </Routes>
    </BrowserRouter>
);
