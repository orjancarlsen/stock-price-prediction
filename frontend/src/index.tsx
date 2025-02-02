import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CompanyPage from './CompanyPage';
import HomePage from './HomePage';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage /> } />
            <Route path="/:ticker" element={<CompanyPage />} />
        </Routes>
    </BrowserRouter>
);
