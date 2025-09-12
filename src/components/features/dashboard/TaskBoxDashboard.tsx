import { FC } from 'react';
import { KPICards } from './KPICards';
import { TaskDistribution } from './TaskDistribution';
import { ProjectProgress } from './ProjectProgress';

export const TaskBoxDashboard: FC = () => {

  return (
    <div className="h-full overflow-auto">
      <div className="w-full p-4 md:p-6 xl:p-8 space-y-4 , md:space-y-6,xl:space-y-8">
        {/* KPI Cards Section */}
        <KPICards />

        {/* Task Distribution Section */}
        <TaskDistribution />

        {/* Project Progress Section */}
        <ProjectProgress />
      </div>
    </div>
  );
};






