// src/pages/LineChart.tsx
import React from 'react';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface DataPoint {
    name: string;
    value: number;
}

interface LineChartProps {
    data: DataPoint[];
    dataKey: string;
    lineColor?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, dataKey, lineColor = '#4f46e5' }) => {
    return (
        <ResponsiveContainer width="100%" height={100}>
            <RechartsLineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide={true} />
                <Tooltip 
                    formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR')}`}
                    labelFormatter={(label) => `Mês ${label}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line 
                    type="monotone" 
                    dataKey={dataKey} 
                    stroke={lineColor} 
                    strokeWidth={2} 
                    dot={false} 
                    animationDuration={500}
                />
            </RechartsLineChart>
        </ResponsiveContainer>
    );
};

export default LineChart;