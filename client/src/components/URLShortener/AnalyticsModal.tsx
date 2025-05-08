import BaseModal from '../common/BaseModal';
import { URLStats } from '../../../../shared/types/url_shortener';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: URLStats | null;
  isLoading: boolean;
}

export default function AnalyticsModal({ isOpen, onClose, stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="URL Analytics">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </BaseModal>
    );
  }

  if (!stats) {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="URL Analytics">
        <div className="text-center py-8 text-gray-500">
          No analytics data available
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="URL Analytics"
      description={`Analytics for ${window.location.origin}/${stats.slug}`}
    >
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Clicks"
            value={stats.clicks.total}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
          />
          <StatCard
            title="Mobile"
            value={stats.clicks.mobileVsDesktop.mobile}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Desktop"
            value={stats.clicks.mobileVsDesktop.desktop}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Bot Clicks"
            value={stats.clicks.total - (stats.clicks.mobileVsDesktop.mobile + stats.clicks.mobileVsDesktop.desktop)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            }
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browsers */}
          <StatSection
            title="Browsers"
            data={stats.clicks.browsers}
          />

          {/* Operating Systems */}
          <StatSection
            title="Operating Systems"
            data={stats.clicks.os}
          />

          {/* Devices */}
          <StatSection
            title="Devices"
            data={stats.clicks.devices}
          />

          {/* Referrers */}
          <StatSection
            title="Top Referrers"
            data={stats.clicks.referrers}
          />
        </div>

        {/* Timeline */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Clicks Over Time</h3>
          <div className="h-32">
            <TimelineChart data={stats.clicks.overTime} />
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100">
      <div className="flex items-center text-purple-600 mb-2">
        {icon}
        <span className="text-xs font-medium ml-1">{title}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function StatSection({ title, data }: { title: string; data: Record<string, number> }) {
  const sortedData = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {sortedData.map(([name, count]) => (
          <div key={name} className="flex items-center">
            <div className="flex-1 flex items-center">
              <span className="text-sm text-gray-600">{name}</span>
              <div className="ml-2 flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
            <span className="ml-2 text-sm text-gray-500">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="flex items-end h-full space-x-1">
      {data.map(({ date, count }) => (
        <div
          key={date}
          className="flex-1 flex flex-col items-center group"
          title={`${date}: ${count} clicks`}
        >
          <div className="w-full">
            <div
              className="w-full bg-purple-200 hover:bg-purple-300 transition-all duration-200"
              style={{ height: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-top-left">
            {new Date(date).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
