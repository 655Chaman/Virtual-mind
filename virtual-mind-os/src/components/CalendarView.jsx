import React, { useState, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, startOfWeek, endOfWeek,
  addMonths, subMonths, parseISO, differenceInDays
} from 'date-fns';

const CalendarView = ({ pillar, logs, onBack }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const nextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));
  const prevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));

  // Pre-calculate stats
  const { loggedThisMonth, longestStreak, lastLoggedDate } = useMemo(() => {
    let loggedThisMonthCount = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    let prevDate = null;

    // Filter logs for this pillar and sort ascending
    const sortedLogDates = Object.entries(logs)
      .filter(([_, log]) => log.folders && log.folders.includes(pillar.id))
      .map(([dateStr]) => parseISO(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());

    sortedLogDates.forEach((date) => {
      // Last logged date
      if (!lastDate || date > lastDate) {
        lastDate = date;
      }

      // Logged this month
      if (isSameMonth(date, currentMonthDate)) {
        loggedThisMonthCount++;
      }

      // Streak calculation
      if (!prevDate) {
        currentStreak = 1;
        maxStreak = 1;
      } else {
        const diff = differenceInDays(date, prevDate);
        if (diff === 1) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else if (diff > 1) {
          currentStreak = 1;
        }
      }
      prevDate = date;
    });

    return {
      loggedThisMonth: loggedThisMonthCount,
      longestStreak: maxStreak,
      lastLoggedDate: lastDate
    };
  }, [logs, pillar.id, currentMonthDate]);

  const getDayStatus = (date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    if (logs[dateStr] && logs[dateStr].folders.includes(pillar.id)) {
      return { status: 'logged', log: logs[dateStr] };
    }
    const today = new Date();
    if (isSameDay(date, today)) return { status: 'today', log: null };
    return { status: 'empty', log: null };
  };

  const getRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  return (
    <div className="calendar-view" style={{ 
      '--pillar-color': pillar.color,
      '--folder-accent-rgb': getRGB(pillar.color)
    }}>
      <header className="calendar-header">
        <h2 className="folder-name">{pillar.name}</h2>
        
        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}>←</button>
          <span>{format(currentMonthDate, 'MMMM yyyy').toUpperCase()}</span>
          <button className="nav-btn" onClick={nextMonth}>→</button>
        </div>

        <button className="back-btn" onClick={onBack}>
          ← BACK
        </button>
      </header>

      <div className="calendar-main-layout">
        <div className="calendar-grid">
          <div className="weekday-header">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="weekday">{d}</div>
            ))}
          </div>
          
          <div className="days-grid">
            {days.map((day, i) => {
              const { status, log } = getDayStatus(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              if (!isCurrentMonth) {
                return <div key={i} className="day-cell invisible" />;
              }
              
              return (
                <div 
                  key={i} 
                  className={`day-cell ${status} ${selectedDay && isSameDay(day, parseISO(selectedDay.date)) ? 'selected' : ''}`}
                  onClick={() => log && setSelectedDay({ ...log, date: log.date || format(day, 'yyyy-MM-dd') })}
                >
                  <span className="day-number">{format(day, 'd')}</span>
                  {status === 'logged' && (
                    <>
                      <div className="dot" />
                      <div className="tooltip">
                        {log.text.length > 60 ? log.text.substring(0, 60) + '...' : log.text}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-stats">
            <p>{loggedThisMonth} days logged this month</p>
            <p>Longest streak: {longestStreak} days</p>
            <p>Last logged: {lastLoggedDate ? format(lastLoggedDate, 'MMMM do, yyyy') : 'Never'}</p>
          </div>
        </div>

        {selectedDay && (
          <div className="detail-panel">
            <header className="detail-header">
              <h3>{format(parseISO(selectedDay.date), 'EEEE, MMM dd').toUpperCase()}</h3>
              <button className="close-panel" onClick={() => setSelectedDay(null)}>×</button>
            </header>
            <div className="detail-content">
              <section>
                <label>COMMAND LOG</label>
                <p>{selectedDay.text}</p>
              </section>
              
              {selectedDay.work_done && (
                <section>
                  <label>WORK DONE</label>
                  <div className="rich-content">{selectedDay.work_done}</div>
                </section>
              )}

              {selectedDay.lessons_learned && (
                <section>
                  <label>LESSONS LEARNED</label>
                  <div className="rich-content">{selectedDay.lessons_learned}</div>
                </section>
              )}

              {!selectedDay.work_done && !selectedDay.lessons_learned && (
                <p className="no-data">No detailed breakdown found for this entry.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .calendar-view {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          height: 100vh;
          background: #060606;
          box-sizing: border-box;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }

        .folder-name {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          margin: 0;
          color: var(--pillar-color);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.2rem;
          color: #e8e0cc;
          letter-spacing: 0.1em;
        }

        .nav-btn {
          background: none;
          border: none;
          color: var(--pillar-color);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          transition: transform 0.2s;
        }
        
        .nav-btn:hover {
          transform: scale(1.2);
          box-shadow: none;
          background: none;
        }

        .back-btn {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e8e0cc;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          padding: 0.5rem 1rem;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #e8e0cc;
          box-shadow: none;
        }

        .calendar-main-layout {
          display: flex;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
          height: calc(100% - 150px);
        }

        .calendar-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .weekday-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 1rem;
        }

        .weekday {
          text-align: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.6rem;
          color: #6b6352;
          letter-spacing: 0.2em;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          flex: 1;
          margin-bottom: 2rem;
        }

        .day-cell {
          aspect-ratio: 1;
          background: #0e0e0e; /* dark */
          border: 1px solid rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s;
          cursor: pointer;
        }

        .day-cell.invisible {
          visibility: hidden;
        }

        .day-cell:hover {
          background: #1a1a1a; /* subtle surface background */
        }

        .day-cell.selected {
          border: 2px solid var(--pillar-color) !important;
          background: rgba(var(--folder-accent-rgb), 0.2);
        }

        .day-number {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          color: #6b6352;
          transition: color 0.3s;
        }

        .day-cell.today {
          border: 1px solid var(--pillar-color);
        }
        .day-cell.today .day-number {
          color: var(--pillar-color);
        }

        .day-cell.logged .day-number {
          color: var(--pillar-color);
        }
        .day-cell.logged .dot {
          width: 4px;
          height: 4px;
          background: var(--pillar-color);
          border-radius: 50%;
          position: absolute;
          bottom: 15%;
          box-shadow: 0 0 10px var(--pillar-color);
        }

        .detail-panel {
          width: 450px;
          background: #0e0e0e;
          border-left: 1px solid rgba(var(--folder-accent-rgb), 0.2);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .detail-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-header h3 {
          font-family: 'Cinzel', serif;
          margin: 0;
          color: var(--pillar-color);
          letter-spacing: 0.1em;
          font-size: 1.1rem;
        }

        .close-panel {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
        }

        .detail-content {
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        section {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        section label {
          font-size: 0.6rem;
          color: var(--pillar-color);
          letter-spacing: 0.2em;
          font-family: 'Share Tech Mono', monospace;
          opacity: 0.8;
        }

        section p, .rich-content {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          color: #e8e0cc;
          margin: 0;
          white-space: pre-wrap;
        }

        .no-data {
          font-family: 'Share Tech Mono', monospace;
          font-style: italic;
          color: var(--text-muted);
          text-align: center;
          margin-top: 4rem;
        }

        /* TOOLTIP */
        .tooltip {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: #000;
          border: 1px solid var(--pillar-color);
          color: #e8e0cc;
          padding: 0.5rem;
          border-radius: 4px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.7rem;
          width: max-content;
          max-width: 250px;
          text-align: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          z-index: 100;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
          pointer-events: none;
        }

        .day-cell.logged:hover .tooltip {
          opacity: 1;
          visibility: visible;
          bottom: 125%;
        }

        .calendar-stats {
          display: flex;
          justify-content: space-between;
          padding: 0 1rem;
        }

        .calendar-stats p {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          color: #6b6352;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
