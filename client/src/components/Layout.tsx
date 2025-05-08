export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-slate-50 transition-colors duration-500">
      <div className="h-2 bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500"></div>
      {children}
    </div>
  );
};