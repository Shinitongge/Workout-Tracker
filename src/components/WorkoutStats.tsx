import React, { useEffect, useState } from 'react';
import { WeeklyStats, calculateWeeklyStats, WorkoutSession } from '../models/WorkoutTypes';

interface WorkoutStatsProps {
    currentSession: WorkoutSession;
}

interface HistoricalAverage {
    totalFailureSets: number;
    totalVolume: number;
}

interface WeekRange {
    start: Date;
    end: Date;
}

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({ currentSession }) => {
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
    const [historicalAvg, setHistoricalAvg] = useState<Map<string, HistoricalAverage>>(new Map());

    useEffect(() => {
        // 计算当前周统计
        const stats = calculateWeeklyStats(currentSession);
        setWeeklyStats(stats);

        // 计算历史平均值
        const { startDate } = stats;
        const pastWeeks: WeekRange[] = [];
        
        // 获取过去4周的日期范围
        for (let i = 1; i <= 4; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() - (7 * i));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            pastWeeks.push({ start: weekStart, end: weekEnd });
        }

        // 计算每个动作的历史平均值
        const historicalStats = new Map<string, HistoricalAverage>();
        stats.exerciseStats.forEach(stat => {
            let totalFailureSets = 0;
            let totalVolume = 0;
            let weeksWithData = 0;

            pastWeeks.forEach((week: WeekRange) => {
                const weekStats = calculateWeeklyStats({
                    id: '',
                    date: week.start,
                    sets: []
                });
                
                const exerciseStats = weekStats.exerciseStats.find(
                    s => s.exerciseId === stat.exerciseId
                );

                if (exerciseStats) {
                    totalFailureSets += exerciseStats.totalFailureSets;
                    totalVolume += exerciseStats.totalVolume;
                    weeksWithData++;
                }
            });

            historicalStats.set(stat.exerciseId, {
                totalFailureSets: weeksWithData ? totalFailureSets / weeksWithData : 0,
                totalVolume: weeksWithData ? totalVolume / weeksWithData : 0
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