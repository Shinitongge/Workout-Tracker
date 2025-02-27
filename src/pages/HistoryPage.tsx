import React, { useState, useEffect } from 'react';
import { 
    WorkoutSession, 
    Exercise, 
    WorkoutSet,
    storageKeys, 
    getFromLocalStorage,
    saveToLocalStorage 
} from '../models/WorkoutTypes';
import { WorkoutSetList } from '../components/WorkoutSetList';

export const HistoryPage: React.FC = () => {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
    const exercises = getFromLocalStorage(storageKeys.EXERCISES) || [];

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        const savedSessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
        // 按日期降序排序
        savedSessions.sort((a: WorkoutSession, b: WorkoutSession) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(savedSessions);
    };

    const handleSetUpdate = (updatedSet: WorkoutSet) => {
        if (!selectedSession) return;

        const updatedSession = {
            ...selectedSession,
            sets: selectedSession.sets.map(set => 
                set.id === updatedSet.id ? updatedSet : set
            )
        };

        const updatedSessions = sessions.map(session =>
            session.id === selectedSession.id ? updatedSession : session
        );

        setSessions(updatedSessions);
        setSelectedSession(updatedSession);
        saveToLocalStorage(storageKeys.SESSIONS, updatedSessions);
    };

    const handleSetDelete = (setId: string) => {
        if (!selectedSession || !window.confirm('确定要删除这组记录吗？')) return;

        const updatedSession = {
            ...selectedSession,
            sets: selectedSession.sets.filter(set => set.id !== setId)
        };

        const updatedSessions = sessions.map(session =>
            session.id === selectedSession.id ? updatedSession : session
        );

        setSessions(updatedSessions);
        setSelectedSession(updatedSession);
        saveToLocalStorage(storageKeys.SESSIONS, updatedSessions);
    };

    const handleSessionDelete = (sessionId: string) => {
        if (!window.confirm('确定要删除这天的所有记录吗？')) return;

        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        setSelectedSession(null);
        saveToLocalStorage(storageKeys.SESSIONS, updatedSessions);
    };

    return (
        <div className="history-page">
            <h1>训练历史记录</h1>
            
            <div className="history-layout">
                <div className="sessions-list">
                    <h2>训练日期列表</h2>
                    {sessions.map(session => (
                        <div 
                            key={session.id} 
                            className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
                            onClick={() => setSelectedSession(session)}
                        >
                            <span className="session-date">
                                {new Date(session.date).toLocaleDateString()}
                            </span>
                            <span className="session-sets">
                                {session.sets.length} 组
                            </span>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSessionDelete(session.id);
                                }}
                                className="delete-button"
                            >
                                删除
                            </button>
                        </div>
                    ))}
                </div>

                <div className="session-details">
                    {selectedSession ? (
                        <>
                            <h2>{new Date(selectedSession.date).toLocaleDateString()} 训练记录</h2>
                            <WorkoutSetList
                                sets={selectedSession.sets}
                                onSetUpdate={handleSetUpdate}
                                onSetDelete={handleSetDelete}
                            />
                        </>
                    ) : (
                        <div className="no-selection">
                            请选择一个训练日期查看详情
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 