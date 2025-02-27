export interface Exercise {
    id: string;
    name: string;
}

export interface WorkoutSet {
    id: string;
    exerciseId: string;
    reps: number;
    weight: number;
    date: Date;
    isNearFailure: boolean;  // 添加力竭标记
}

export interface WorkoutSession {
    id: string;
    date: Date;
    sets: WorkoutSet[];
}

// 本地存储相关的工具函数
export const storageKeys = {
    EXERCISES: 'workout_exercises',
    SESSIONS: 'workout_sessions'
};

export const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

// 训练统计接口
export interface ExerciseStats {
    exerciseId: string;
    exerciseName: string;
    totalFailureSets: number;  // 改为力竭组数
    totalVolume: number;
    maxWeight: number;
}

export interface WeeklyStats {
    startDate: Date;
    endDate: Date;
    exerciseStats: ExerciseStats[];
}

// 获取本周的开始和结束日期
export const getWeekRange = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    return { startDate, endDate };
};

// 计算本周训练统计
export const calculateWeeklyStats = (currentSession: WorkoutSession): WeeklyStats => {
    const { startDate, endDate } = getWeekRange();
    const sessions = getFromLocalStorage(storageKeys.SESSIONS) || [];
    const exercises = getFromLocalStorage(storageKeys.EXERCISES) || [];

    // 确保日期对象的正确处理
    const isInCurrentWeek = (date: Date | string) => {
        const checkDate = new Date(date);
        return checkDate >= startDate && checkDate < endDate;
    };

    // 过滤出本周的已保存会话
    const weekSessions = sessions
        .filter((session: WorkoutSession) => {
            return session.id !== currentSession.id && // 排除当前会话
                   isInCurrentWeek(session.date);
        })
        .map((session: WorkoutSession) => ({  // 添加类型声明
            ...session,
            date: new Date(session.date) // 确保日期是 Date 对象
        }));

    // 添加当前会话（如果是本周的）
    if (isInCurrentWeek(currentSession.date)) {
        weekSessions.push({
            ...currentSession,
            date: new Date(currentSession.date)
        });
    }

    const statsMap = new Map<string, ExerciseStats>();

    weekSessions.forEach((session: WorkoutSession) => {
        session.sets.forEach((set: WorkoutSet) => {
            const exercise = exercises.find((e: Exercise) => e.id === set.exerciseId);
            if (!exercise) return;

            const stats = statsMap.get(set.exerciseId) || {
                exerciseId: set.exerciseId,
                exerciseName: exercise.name,
                totalFailureSets: 0,
                totalVolume: 0,
                maxWeight: 0
            };

            if (set.isNearFailure) {
                stats.totalFailureSets += 1;
            }
            stats.totalVolume += set.weight * set.reps;
            stats.maxWeight = Math.max(stats.maxWeight, set.weight);

            statsMap.set(set.exerciseId, stats);
        });
    });

    return {
        startDate,
        endDate,
        exerciseStats: Array.from(statsMap.values())
    };
}; 