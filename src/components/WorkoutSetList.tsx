import React, { useState } from 'react';
import { Exercise, WorkoutSet, storageKeys, getFromLocalStorage } from '../models/WorkoutTypes';

interface WorkoutSetListProps {
    sets: WorkoutSet[];
    onSetUpdate: (updatedSet: WorkoutSet) => void;
    onSetDelete: (setId: string) => void;
}

export const WorkoutSetList: React.FC<WorkoutSetListProps> = ({
    sets,
    onSetUpdate,
    onSetDelete
}) => {
    const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);

    const exercises = getFromLocalStorage(storageKeys.EXERCISES) || [];

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSet) {
            onSetUpdate(editingSet);
            setEditingSet(null);
        }
    };

    const handleCancel = () => {
        setEditingSet(null);
    };

    return (
        <div className="workout-set-list">
            {sets.map(set => {
                const exercise = exercises.find((e: Exercise) => e.id === set.exerciseId);
                
                if (editingSet?.id === set.id) {
                    return (
                        <form key={set.id} onSubmit={handleEditSubmit} className="set-edit-form">
                            <div className="set-edit-inputs">
                                <span>{exercise?.name}</span>
                                <input
                                    type="number"
                                    value={editingSet.weight}
                                    onChange={e => setEditingSet({
                                        ...editingSet,
                                        weight: Number(e.target.value)
                                    })}
                                    placeholder="重量(kg)"
                                    required
                                />
                                <input
                                    type="number"
                                    value={editingSet.reps}
                                    onChange={e => setEditingSet({
                                        ...editingSet,
                                        reps: Number(e.target.value)
                                    })}
                                    placeholder="次数"
                                    required
                                />
                                <div className="failure-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={editingSet.isNearFailure}
                                        onChange={e => setEditingSet({
                                            ...editingSet,
                                            isNearFailure: e.target.checked
                                        })}
                                        id={`failure-${set.id}`}
                                    />
                                    <label htmlFor={`failure-${set.id}`}>接近力竭</label>
                                </div>
                                <div className="edit-actions">
                                    <button type="submit" className="save-button">保存</button>
                                    <button type="button" onClick={handleCancel}>取消</button>
                                </div>
                            </div>
                        </form>
                    );
                }

                return (
                    <div key={set.id} className="set-item">
                        <div className="set-info">
                            <span className="exercise-name">{exercise?.name}</span>
                            <span className="set-details">
                                {set.weight}kg × {set.reps}次
                                {set.isNearFailure && <span className="failure-badge">力竭</span>}
                            </span>
                        </div>
                        <div className="set-actions">
                            <button 
                                onClick={() => setEditingSet(set)}
                                className="edit-button"
                            >
                                编辑
                            </button>
                            <button 
                                onClick={() => onSetDelete(set.id)}
                                className="delete-button"
                            >
                                删除
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}; 