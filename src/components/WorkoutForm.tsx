import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSet, storageKeys, getFromLocalStorage } from '../models/WorkoutTypes';

interface WorkoutFormProps {
    onSubmit: (set: WorkoutSet) => void;
    onFinishWorkout: () => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
}

type TrainingStage = 'SELECT_EXERCISE' | 'INPUT_SET';

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ 
    onSubmit, 
    onFinishWorkout,
    selectedDate,
    onDateChange
}) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExercise, setCurrentExercise] = useState<string>('');
    const [weight, setWeight] = useState<number>(0);
    const [reps, setReps] = useState<number>(0);
    const [setNumber, setSetNumber] = useState<number>(1);
    const [stage, setStage] = useState<TrainingStage>('SELECT_EXERCISE');
    const [isNearFailure, setIsNearFailure] = useState(false);

    useEffect(() => {
        const savedExercises = getFromLocalStorage(storageKeys.EXERCISES) || [];
        setExercises(savedExercises);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSet: WorkoutSet = {
            id: Date.now().toString(),
            exerciseId: currentExercise,
            reps,
            weight,
            date: new Date(selectedDate),
            isNearFailure
        };

        onSubmit(newSet);
        setSetNumber(prev => prev + 1);
        setReps(0);
        setWeight(0);
        setIsNearFailure(false);
    };

    const handleExerciseChange = (exerciseId: string) => {
        setCurrentExercise(exerciseId);
        setSetNumber(1);
        setWeight(0);
        setReps(0);
        setStage('INPUT_SET');
    };

    const startNewExercise = () => {
        setCurrentExercise('');
        setSetNumber(1);
        setWeight(0);
        setReps(0);
        setStage('SELECT_EXERCISE');
    };

    return (
        <div className="workout-form">
            <div className="date-selector">
                <label htmlFor="training-date">训练日期：</label>
                <input
                    type="date"
                    id="training-date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            {stage === 'SELECT_EXERCISE' && (
                <div className="exercise-selector">
                    <h3>选择训练动作</h3>
                    <div className="input-group">
                        <select
                            value={currentExercise}
                            onChange={(e) => handleExerciseChange(e.target.value)}
                            required
                        >
                            <option value="">请选择动作</option>
                            {exercises.map(exercise => (
                                <option key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {stage === 'INPUT_SET' && (
                <form onSubmit={handleSubmit}>
                    <h3>{exercises.find(e => e.id === currentExercise)?.name}</h3>
                    <div className="input-group">
                        <label>第 {setNumber} 组：</label>
                        <div className="set-inputs">
                            <input
                                type="number"
                                placeholder="重量(kg)"
                                value={weight || ''}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                required
                            />
                            <input
                                type="number"
                                placeholder="重复次数"
                                value={reps || ''}
                                onChange={(e) => setReps(Number(e.target.value))}
                                required
                            />
                            <div className="failure-checkbox">
                                <input
                                    type="checkbox"
                                    id="isNearFailure"
                                    checked={isNearFailure}
                                    onChange={(e) => setIsNearFailure(e.target.checked)}
                                />
                                <label htmlFor="isNearFailure">接近力竭</label>
                            </div>
                        </div>
                    </div>

                    <div className="button-group">
                        <button type="submit">记录本组</button>
                        <button type="button" onClick={startNewExercise}>
                            开始新动作
                        </button>
                        <button type="button" onClick={onFinishWorkout}>
                            结束训练
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}; 