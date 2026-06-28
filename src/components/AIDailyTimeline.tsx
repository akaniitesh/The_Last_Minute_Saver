import React from "react";
import { Task } from "../types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AIDailyTimelineProps {
  tasks: Task[];
}

export default function AIDailyTimeline({ tasks }: AIDailyTimelineProps) {
  const data = tasks.length > 0 ? tasks.map(task => ({
    name: task.title,
    duration: task.effortEstimatedHours || 1,
    status: task.isCompleted ? "Completed" : "Upcoming",
    fill: task.isCompleted ? "#10B981" : "#6366f1"
  })) : [{ name: "No tasks", duration: 0, status: "N/A", fill: "#E5E7EB" }];

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" hide />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
