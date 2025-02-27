import React, { useEffect, useState } from 'react';
import { 
    WorkoutSession, 
    WorkoutSet,
    storageKeys, 
    getFromLocalStorage 
} from '../models/WorkoutTypes';

interface WorkoutStatsProps {
    currentSession: WorkoutSession;
}

interface HistoricalAverage {
    totalFailureSets: number;
    totalVolume: number;
}

interface ExerciseStat {
    exerciseId: string;
    exerciseName: string;
    totalFailureSets: number;
    totalVolume: number;
}

interface WeeklyStats {
    startDate: Date;
    endDate: Date;
    exerciseStats: ExerciseStat[];
}

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({ currentSession }) => {
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
    const [historicalAvg, setHistoricalAvg] = useState<Map<string, HistoricalAverage>>(new Map());

    useEffect(() => {
        // 计算当前周的统计数据
        const currentWeekStart = new Date(currentSession.date);
        currentWeekStart.setHours(0, 0, 0, 0);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

        // 按动作分组计算当前周的统计数据
        const exerciseMap = new Map<string, { name: string; sets: WorkoutSet[] }>();
        currentSession.sets.forEach(set => {
            if (!exerciseMap.has(set.exerciseId)) {
                const exercises = getFromLocalStorage(storageKeys.EXERCISES) || [];
                const exercise = exercises.find((e: any) => e.id === set.exerciseId);
                exerciseMap.set(set.exerciseId, {
                    name: exercise?.name || '未知动作',
                    sets: []
                });
            }
            exerciseMap.get(set.exerciseId)?.sets.push(set);
        });

        const currentStats: WeeklyStats = {
            startDate: currentWeekStart,
            endDate: currentWeekEnd,
            exerciseStats: Array.from(exerciseMap.entries()).map(([id, { name, sets }]) => ({
                exerciseId: id,
                exerciseName: name,
                totalFailureSets: sets.filter(s => s.isNearFailure).length,
                totalVolume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
            }))
        };
        setWeeklyStats(currentStats);

        // 获取所有历史记录
        const allSessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
        
        // 获取过去4周的数据（不包括当前周）
        const pastSessions = allSessions.filter((session: WorkoutSession) => {
            const sessionDate = new Date(session.date);
            const sessionWeekStart = new Date(sessionDate);
            sessionWeekStart.setHours(0, 0, 0, 0);
            sessionWeekStart.setDate(sessionDate.getDate() - sessionDate.getDay());

            return sessionWeekStart < currentWeekStart && 
                   sessionWeekStart >= new Date(currentWeekStart.getTime() - 28 * 24 * 60 * 60 * 1000);
        });

        // 按周分组历史数据
        const weeklyData = new Map<string, WorkoutSession[]>();
        pastSessions.forEach((session: WorkoutSession) => {
            const sessionDate = new Date(session.date);
            const weekStart = new Date(sessionDate);
            weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
            const weekKey = weekStart.toISOString();

            if (!weeklyData.has(weekKey)) {
                weeklyData.set(weekKey, []);
            }
            weeklyData.get(weekKey)?.push(session);
        });

        // 计算每个动作在每周的统计数据
        const exerciseStats = new Map<string, { failureSets: number[], volumes: number[] }>();
        
        weeklyData.forEach((sessions: WorkoutSession[], weekKey: string) => {
            // 合并同一周的所有训练记录
            const weekSets = sessions.flatMap(s => s.sets);
            
            // 按动作分组计算
            weekSets.forEach((set: WorkoutSet) => {
                if (!exerciseStats.has(set.exerciseId)) {
                    exerciseStats.set(set.exerciseId, {
                        failureSets: [],
                        volumes: []
                    });
                }

                const stats = exerciseStats.get(set.exerciseId)!;
                const weekIndex = Array.from(weeklyData.keys()).indexOf(weekKey);

                // 确保数组有足够的位置
                while (stats.failureSets.length <= weekIndex) {
                    stats.failureSets.push(0);
                    stats.volumes.push(0);
                }

                if (set.isNearFailure) {
                    stats.failureSets[weekIndex]++;
                }
                stats.volumes[weekIndex] += set.weight * set.reps;
            });
        });

        // 计算历史平均值
        const historicalStats = new Map<string, HistoricalAverage>();
        exerciseStats.forEach((stats, exerciseId) => {
            const nonZeroWeeks = stats.failureSets.filter(v => v > 0).length;
            const avgFailureSets = nonZeroWeeks > 0 
                ? stats.failureSets.reduce((a, b) => a + b, 0) / nonZeroWeeks 
                : 0;

            const nonZeroVolumeWeeks = stats.volumes.filter(v => v > 0).length;
            const avgVolume = nonZeroVolumeWeeks > 0
                ? stats.volumes.reduce((a, b) => a + b, 0) / nonZeroVolumeWeeks
                : 0;

            historicalStats.set(exerciseId, {
                totalFailureSets: avgFailureSets,
                totalVolume: avgVolume
            });
        });

        setHistoricalAvg(historicalStats);
    }, [currentSession]);

    if (!weeklyStats || weeklyStats.exerciseStats.length === 0) {
        return <div>本周还没有训练记录</div>;
    }

    return (
        <div>
            <h3>本周训练统计 ({weeklyStats.startDate.toLocaleDateString()} - {weeklyStats.endDate.toLocaleDateString()})</h3>
            <table>
                <thead>
                    <tr>
                        <th>训练动作</th>
                        <th>力竭组数 (近4周平均)</th>
                        <th>总容量 (近4周平均)</th>
                    </tr>
                </thead>
                <tbody>
                    {weeklyStats.exerciseStats.map(stat => {
                        const historical = historicalAvg.get(stat.exerciseId);
                        const failureSetsComparison = historical ? 
                            (stat.totalFailureSets / historical.totalFailureSets - 1) * 100 : 0;
                        const volumeComparison = historical ? 
                            (stat.totalVolume / historical.totalVolume - 1) * 100 : 0;

                        return (
                            <tr key={stat.exerciseId}>
                                <td>{stat.exerciseName}</td>
                                <td>
                                    <div className="stats-comparison">
                                        <span className={`current-value ${failureSetsComparison > 0 ? 'increase' : 'decrease'}`}>
                                            {stat.totalFailureSets}
                                        </span>
                                        <span className="separator">/</span>
                                        <span className="historical-value">
                                            {historical ? historical.totalFailureSets.toFixed(1) : '-'}
                                        </span>
                                        {historical && failureSetsComparison !== 0 && (
                                            <span className={`comparison ${failureSetsComparison > 0 ? 'increase' : 'decrease'}`}>
                                                ({failureSetsComparison > 0 ? '+' : ''}{failureSetsComparison.toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="stats-comparison">
                                        <span className={`current-value ${volumeComparison > 0 ? 'increase' : 'decrease'}`}>
                                            {stat.totalVolume}
                                        </span>
                                        <span className="separator">/</span>
                                        <span className="historical-value">
                                            {historical ? historical.totalVolume.toFixed(1) : '-'}
                                        </span>
                                        {historical && volumeComparison !== 0 && (
                                            <span className={`comparison ${volumeComparison > 0 ? 'increase' : 'decrease'}`}>
                                                ({volumeComparison > 0 ? '+' : ''}{volumeComparison.toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 添加空导出，使其成为模块
export {}; 