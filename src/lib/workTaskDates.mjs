export const TASK_STATUSES={todo:'예정',doing:'진행 중',waiting:'회신 대기',done:'완료'};
export function validTaskDate(value){if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
export function taskToday(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function taskBucket(task,today){if(task.status==='done')return 'done';if(!task.dueDate)return 'unscheduled';if(task.dueDate<today)return 'overdue';if(task.dueDate===today)return 'today';return 'upcoming';}
