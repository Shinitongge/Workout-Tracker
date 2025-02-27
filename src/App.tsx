import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { WorkoutPage } from './pages/WorkoutPage';
import { HistoryPage } from './pages/HistoryPage';

// 创建导航组件
const Navigation = () => {
    const location = useLocation();
    
    return (
        <nav className="main-nav">
            <Link 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
            >
                记录训练
            </Link>
            <Link 
                to="/history" 
                className={location.pathname === '/history' ? 'active' : ''}
            >
                历史记录
            </Link>
        </nav>
    );
};

function App() {
    return (
        <Router basename="/Workout-Tracker">
            <div className="App">
                <Navigation />
                <Routes>
                    <Route path="/" element={<WorkoutPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App; 