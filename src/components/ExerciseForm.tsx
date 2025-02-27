import React, { useState, useEffect } from 'react';
import { Exercise, storageKeys, saveToLocalStorage, getFromLocalStorage } from '../models/WorkoutTypes';

interface ExerciseFormProps {
    onExerciseAdded: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({ onExerciseAdded }) => {
    const [exerciseName, setExerciseName] = useState('');
    const [message, setMessage] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = () => {
        const savedExercises = getFromLocalStorage(storageKeys.EXERCISES) || [];
        setExercises(savedExercises);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const savedExercises = getFromLocalStorage(storageKeys.EXERCISES) || [];
        
        if (editingId) {
            // 更新现有动作
            const updatedExercises = savedExercises.map((ex: Exercise) =>
                ex.id === editingId ? { ...ex, name: exerciseName } : ex
            );
            saveToLocalStorage(storageKeys.EXERCISES, updatedExercises);
            setMessage('动作更新成功！');
            setEditingId(null);
        } else {
            // 添加新动作
            const newExercise: Exercise = {
                id: Date.now().toString(),
                name: exerciseName
            };
            savedExercises.push(newExercise);
            saveToLocalStorage(storageKeys.EXERCISES, savedExercises);
            setMessage('动作添加成功！');
        }

        setExerciseName('');
        loadExercises();
        setTimeout(() => setMessage(''), 2000);
        onExerciseAdded();
    };

    const handleEdit = (exercise: Exercise) => {
        setExerciseName(exercise.name);
        setEditingId(exercise.id);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('确定要删除这个动作吗？')) {
            const updatedExercises = exercises.filter(ex => ex.id !== id);
            saveToLocalStorage(storageKeys.EXERCISES, updatedExercises);
            loadExercises();
            onExerciseAdded();
            setMessage('动作删除成功！');
            setTimeout(() => setMessage(''), 2000);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setExerciseName('');
    };

    return (
        <div className="exercise-form">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="输入动作名称"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        required
                    />
                    <button type="submit">
                        {editingId ? '更新动作' : '添加动作'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancel}>
                            取消
                        </button>
                    )}
                </div>
            </form>
            {message && <div className="success-message">{message}</div>}
            
            <div className="exercise-list">
                <h4>已添加的动作：</h4>
                <ul>
                    {exercises.map(exercise => (
                        <li key={exercise.id} className="exercise-item">
                            <span>{exercise.name}</span>
                            <div className="exercise-actions">
                                <button 
                                    type="button" 
                                    onClick={() => handleEdit(exercise)}
                                    className="edit-button"
                                >
                                    编辑
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleDelete(exercise.id)}
                                    className="delete-button"
                                >
                                    删除
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}; 