import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Award, Clock, BookOpen, Users, Calendar } from 'lucide-react';
import type { Semester } from '../types';

interface PerformanceAnalyticsProps {
  semester: Semester;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

interface GradePredictionProps {
  subject: string;
  current: number;
  predicted: number;
  confidence: number;
}

const MetricCard = ({ title, value, subtitle, trend, icon, color }: MetricCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const colorStyles = {
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      accent: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-500/10',
      icon: 'text-green-500',
      accent: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-500/10',
      icon: 'text-orange-500',
      accent: 'text-orange-600'
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-500',
      accent: 'text-purple-600'
    }
  };

  const style = colorStyles[color];

  return (
    <div className="bg-background border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2 rounded-lg", style.bg)}>
              <div className={style.icon}>
                {icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          
          <div className="space-y-1">
            <div className={cn("text-2xl font-bold", style.accent)}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.direction === 'up' ? "bg-green-500/10 text-green-600" :
            trend.direction === 'down' ? "bg-red-500/10 text-red-600" :
            "bg-muted text-muted-foreground"
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};

const GradePredictionBar = ({ subject, current, predicted, confidence }: GradePredictionProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const improvement = predicted - current;
  const maxScore = 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">{subject}</h4>
          <p className="text-xs text-muted-foreground">
            {confidence}% confidence • {improvement > 0 ? '+' : ''}{improvement.toFixed(1)} points
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">{predicted}%</div>
          <div className="text-xs text-muted-foreground">Predicted</div>
        </div>
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Current Progress */}
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${(current / maxScore) * 100}%` }}
        />
        
        {/* Predicted Progress */}
        <div 
          className="absolute top-0 left-0 h-full bg-green-500/60 rounded-full transition-all duration-1000 delay-300"
          style={{ width: `${(predicted / maxScore) * 100}%` }}
        />
        
        {/* Current marker */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-1 h-4 bg-blue-600 shadow-lg"
          style={{ left: `${(current / maxScore) * 100}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-600 font-medium">Current: {current}%</span>
        <span className="text-green-600 font-medium">Target: {predicted}%</span>
      </div>
    </div>
  );
};

const StudyEfficiencyCard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const efficiencyData = [
    { day: 'Mon', hours: 6, efficiency: 85 },
    { day: 'Tue', hours: 4, efficiency: 92 },
    { day: 'Wed', hours: 7, efficiency: 78 },
    { day: 'Thu', hours: 5, efficiency: 88 },
    { day: 'Fri', hours: 3, efficiency: 95 },
    { day: 'Sat', hours: 8, efficiency: 82 },
    { day: 'Sun', hours: 4, efficiency: 90 }
  ];

  const avgEfficiency = efficiencyData.reduce((acc, day) => acc + day.efficiency, 0) / efficiencyData.length;

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Study Efficiency</h3>
            <p className="text-sm text-muted-foreground">This week's performance</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{avgEfficiency.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
      </div>
      
      <div className="space-y-3">
        {efficiencyData.map((day, index) => (
          <div key={day.day} className="flex items-center gap-4">
            <div className="w-8 text-xs font-medium text-muted-foreground">
              {day.day}
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    day.efficiency >= 90 ? "bg-green-500" :
                    day.efficiency >= 80 ? "bg-blue-500" :
                    day.efficiency >= 70 ? "bg-yellow-500" : "bg-orange-500"
                  )}
                  style={{ 
                    width: `${day.efficiency}%`,
                    transitionDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <div className="text-xs font-medium text-foreground w-8">
                {day.efficiency}%
              </div>
            </div>
            <div className="text-xs text-muted-foreground w-12">
              {day.hours}h
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UpcomingMilestones = () => {
  const milestones = [
    {
      title: "Data Structures IA-2",
      date: "Jan 15",
      daysLeft: 5,
      type: "exam",
      priority: "high"
    },
    {
      title: "DBMS Assignment",
      date: "Jan 18",
      daysLeft: 8,
      type: "assignment",
      priority: "medium"
    },
    {
      title: "Algorithm Project",
      date: "Jan 22",
      daysLeft: 12,
      type: "project",
      priority: "high"
    }
  ];

  return (
    <div className="bg-background border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Target className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Upcoming Milestones</h3>
          <p className="text-sm text-muted-foreground">Focus areas for this month</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                milestone.priority === 'high' ? "bg-red-500" :
                milestone.priority === 'medium' ? "bg-yellow-500" : "bg-green-500"
              )} />
              <div>
                <h4 className="font-medium text-foreground">{milestone.title}</h4>
                <p className="text-xs text-muted-foreground capitalize">{milestone.type} • Due {milestone.date}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-sm font-medium",
                milestone.daysLeft <= 7 ? "text-red-600" :
                milestone.daysLeft <= 14 ? "text-yellow-600" : "text-green-600"
              )}>
                {milestone.daysLeft} days
              </div>
              <div className="text-xs text-muted-foreground">remaining</div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
        View All Tasks
      </button>
    </div>
  );
};

export const PerformanceAnalytics = ({ semester }: PerformanceAnalyticsProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Mock data - replace with real data from your backend
  const mockSubjects = [
    { subject: "Data Structures", current: 78, predicted: 85, confidence: 92 },
    { subject: "Algorithms", current: 82, predicted: 87, confidence: 88 },
    { subject: "Database Management", current: 85, predicted: 89, confidence: 95 },
    { subject: "Computer Networks", current: 75, predicted: 82, confidence: 85 }
  ];

  const overallCGPA = 8.4;
  const predictedCGPA = 8.7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your academic progress and predictions</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current CGPA"
          value={overallCGPA.toString()}
          subtitle="Based on completed assessments"
          trend={{ value: "+0.3", direction: "up" }}
          icon={<Award className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Predicted Final"
          value={predictedCGPA.toString()}
          subtitle="AI-based prediction"
          trend={{ value: "+0.3", direction: "up" }}
          icon={<Target className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Study Efficiency"
          value="87%"
          subtitle="Time vs Results ratio"
          trend={{ value: "+5%", direction: "up" }}
          icon={<Clock className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Attendance"
          value="92%"
          subtitle="Overall attendance rate"
          trend={{ value: "+2%", direction: "up" }}
          icon={<Users className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Predictions */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Grade Predictions</h3>
                <p className="text-sm text-muted-foreground">Subject-wise performance forecast</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {mockSubjects.map((subject, index) => (
              <GradePredictionBar
                key={index}
                subject={subject.subject}
                current={subject.current}
                predicted={subject.predicted}
                confidence={subject.confidence}
              />
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{predictedCGPA} CGPA</div>
              <div className="text-sm text-muted-foreground">Predicted Final Grade</div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on current performance trends
              </div>
            </div>
          </div>
        </div>

        {/* Study Efficiency */}
        <StudyEfficiencyCard />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMilestones />
        
        {/* Quick Actions */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Recommended next steps</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">Upload IA-1 Results</div>
              <div className="text-xs text-muted-foreground">Update your performance data</div>
            </button>
            <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">Create Study Plan</div>
              <div className="text-xs text-muted-foreground">AI-optimized schedule for IA-2</div>
            </button>
            <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">Set Study Goals</div>
              <div className="text-xs text-muted-foreground">Target grades for remaining exams</div>
            </button>
            <button className="w-full p-3 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">View Detailed Reports</div>
              <div className="text-xs text-muted-foreground">Deep dive into performance metrics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 