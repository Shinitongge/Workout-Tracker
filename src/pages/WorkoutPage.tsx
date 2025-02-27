import React, { useState } from 'react';
import { ExerciseForm } from '../components/ExerciseForm';
import { WorkoutForm } from '../components/WorkoutForm';
import { 
    WorkoutSet, 
    WorkoutSession, 
    Exercise,
    storageKeys, 
    saveToLocalStorage, 
    getFromLocalStorage 
} from '../models/WorkoutTypes';
import { WorkoutStats } from '../components/WorkoutStats';
import { WorkoutSetList } from '../components/WorkoutSetList';

export const WorkoutPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });

    const [currentSession, setCurrentSession] = useState<WorkoutSession>(() => ({
        id: Date.now().toString(),
        date: new Date(selectedDate),
        sets: []
    }));
    const [isTrainingFinished, setIsTrainingFinished] = useState(false);
    const [exerciseVersion, setExerciseVersion] = useState(0);

    const handleExerciseAdded = () => {
        setExerciseVersion(v => v + 1);
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        const sessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
        const existingSession = sessions.find((s: WorkoutSession) => {
            const sessionDate = new Date(s.date);
            const compareDate = new Date(date);
            return sessionDate.toDateString() === compareDate.toDateString();
        });

        if (existingSession) {
            setCurrentSession(existingSession);
        } else {
            setCurrentSession({
                id: Date.now().toString(),
                date: new Date(date),
                sets: []
            });
        }
    };

    const handleSetSubmit = (set: WorkoutSet) => {
        const updatedSession = {
            ...currentSession,
            sets: [...currentSession.sets, set]
        };
        
        setCurrentSession(updatedSession);
        
        const sessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
        const sessionIndex = sessions.findIndex((s: WorkoutSession) => s.id === currentSession.id);
        
        if (sessionIndex >= 0) {
            sessions[sessionIndex] = updatedSession;
        } else {
            sessions.push(updatedSession);
        }
        
        saveToLocalStorage(storageKeys.SESSIONS, sessions);
    };

    const startNewWorkout = () => {
        setCurrentSession({
            id: Date.now().toString(),
            date: new Date(selectedDate),
            sets: []
        });
        setIsTrainingFinished(false);
    };

    const handleFinishWorkout = () => {
        setIsTrainingFinished(true);
    };

    const handleSetUpdate = (updatedSet: WorkoutSet) => {
        const updatedSession = {
            ...currentSession,
            sets: currentSession.sets.map(set => 
                set.id === updatedSet.id ? updatedSet : set
            )
        };
        
        setCurrentSession(updatedSession);
        
        const sessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
        const sessionIndex = sessions.findIndex((s: WorkoutSession) => s.id === currentSession.id);
        
        if (sessionIndex >= 0) {
            sessions[sessionIndex] = updatedSession;
            saveToLocalStorage(storageKeys.SESSIONS, sessions);
        }
    };

    const handleSetDelete = (setId: string) => {
        if (window.confirm('确定要删除这组记录吗？')) {
            const updatedSession = {
                ...currentSession,
                sets: currentSession.sets.filter(set => set.id !== setId)
            };
            
            setCurrentSession(updatedSession);
            
            const sessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
            const sessionIndex = sessions.findIndex((s: WorkoutSession) => s.id === currentSession.id);
            
            if (sessionIndex >= 0) {
                sessions[sessionIndex] = updatedSession;
                saveToLocalStorage(storageKeys.SESSIONS, sessions);
            }
        }
    };

    return (
        <div>
            <h1>训练记录</h1>
            
            {!isTrainingFinished ? (
                <>
                    <section>
                        <h2>本周统计</h2>
                        <WorkoutStats currentSession={currentSession} />
                    </section>

                    <section>
                        <h2>添加新动作</h2>
                        <ExerciseForm onExerciseAdded={handleExerciseAdded} />
                    </section>
                    
                    <section>
                        <h2>记录训练</h2>
                        <WorkoutForm 
                            key={exerciseVersion}
                            onSubmit={handleSetSubmit}
                            onFinishWorkout={handleFinishWorkout}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                        />
                    </section>

                    <section>
                        <h2>当前训练记录</h2>
                        <WorkoutSetList 
                            sets={currentSession.sets}
                            onSetUpdate={handleSetUpdate}
                            onSetDelete={handleSetDelete}
                        />
                    </section>
                </>
            ) : (
                <div>
                    <h2>训练完成！</h2>
                    <p>本次训练共完成 {currentSession.sets.length} 组</p>
                    <WorkoutStats currentSession={currentSession} />
                    <button onClick={startNewWorkout}>开始新的训练</button>
                </div>
            )}
        </div>
    );
}; 