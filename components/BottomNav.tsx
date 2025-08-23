import React from 'react';
import CalendarDaysIcon from './icons/CalendarDaysIcon.tsx';
import HistoryIcon from './icons/HistoryIcon.tsx';
import UserGroupIcon from './icons/UserGroupIcon.tsx';

type View = 'dashboard' | 'calculator' | 'history';

interface BottomNavProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    const activeClass = isActive ? 'text-brand-primary' : 'text-slate-500';
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${activeClass} hover:text-brand-primary`}
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-white border-t border-slate-200 shadow-t-lg flex justify-around">
            <NavItem 
                label="Dashboard"
                icon={<UserGroupIcon />}
                isActive={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
                label="Kalkulator"
                icon={<CalendarDaysIcon />}
                isActive={currentView === 'calculator'}
                onClick={() => setCurrentView('calculator')}
            />
            <NavItem 
                label="Riwayat"
                icon={<HistoryIcon />}
                isActive={currentView === 'history'}
                onClick={() => setCurrentView('history')}
            />
        </div>
    );
};

export default BottomNav;