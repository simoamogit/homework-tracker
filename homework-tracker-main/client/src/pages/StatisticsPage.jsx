import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../services/api';
import Navbar from '../components/Navbar';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import styles from './StatisticsPage.module.css';

const COLORS = ['#111111','#444444','#777777','#aaaaaa','#555555','#888888','#cccccc'];

function getWeekLabel(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return `${monday.getDate()}/${monday.getMonth() + 1}`;
}

export default function StatisticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => getTasks().then(r => r.data),
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const tasks = data;
    const today = new Date().toLocaleDateString('en-CA');

    // Streak: giorni consecutivi con tutti i compiti completati
    const byDate = tasks.reduce((acc, t) => {
      const k = new Date(t.date).toLocaleDateString('en-CA');
      if (!acc[k]) acc[k] = { total: 0, done: 0 };
      acc[k].total++;
      if (t.completed) acc[k].done++;
      return acc;
    }, {});

    const pastDates = Object.keys(byDate).filter(d => d <= today).sort().reverse();
    let streak = 0;
    for (const d of pastDates) {
      if (byDate[d].total > 0 && byDate[d].done === byDate[d].total) streak++;
      else break;
    }

    // Ultime 8 settimane
    const weeklyData = {};
    tasks.forEach(t => {
      const k = getWeekLabel(t.date);
      if (!weeklyData[k]) weeklyData[k] = { week: k, completati: 0, totale: 0 };
      weeklyData[k].totale++;
      if (t.completed) weeklyData[k].completati++;
    });
    const weeks = Object.values(weeklyData).slice(-8);

    // Per materia
    const bySubject = tasks.reduce((acc, t) => {
      if (!acc[t.subject]) acc[t.subject] = { name: t.subject, valore: 0 };
      acc[t.subject].valore++;
      return acc;
    }, {});
    const subjects = Object.values(bySubject).sort((a, b) => b.valore - a.valore).slice(0, 8);

    // Totali
    const total     = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate      = total ? Math.round((completed / total) * 100) : 0;

    return { streak, weeks, subjects, total, completed, rate };
  }, [data]);

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h2 className={styles.heading}>Statistiche</h2>

        {isLoading && <SkeletonLoader />}
        {error     && <p className={styles.error}>Impossibile caricare i dati.</p>}

        {stats && (
          <>
            {/* KPI cards */}
            <div className={styles.kpiGrid}>
              <div className={styles.kpi}>
                <span className={styles.kpiValue}>{stats.total}</span>
                <span className={styles.kpiLabel}>Compiti totali</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiValue}>{stats.completed}</span>
                <span className={styles.kpiLabel}>Completati</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiValue}>{stats.rate}%</span>
                <span className={styles.kpiLabel}>Tasso completamento</span>
              </div>
              <div className={`${styles.kpi} ${stats.streak > 0 ? styles.kpiHighlight : ''}`}>
                <span className={styles.kpiValue}>{stats.streak}</span>
                <span className={styles.kpiLabel}>
                  Streak {stats.streak === 1 ? 'giorno' : 'giorni'} consecutivi
                </span>
              </div>
            </div>

            {/* Grafico settimanale */}
            {stats.weeks.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Completati per settimana</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.weeks} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}
                      labelStyle={{ color: 'var(--text-1)', fontWeight: 700 }}
                      itemStyle={{ color: 'var(--text-2)' }}
                    />
                    <Bar dataKey="totale"     name="Totale"     fill="var(--border)" radius={[3,3,0,0]} />
                    <Bar dataKey="completati" name="Completati" fill="var(--accent)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Grafico per materia */}
            {stats.subjects.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Compiti per materia</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.subjects}
                      dataKey="valore"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.subjects.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}