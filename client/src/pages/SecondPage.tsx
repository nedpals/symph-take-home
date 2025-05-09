import { Link } from "react-router";

function SecondPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-gray-800 mb-2">
            Second Page
          </h1>
          <p className="text-gray-600">
            This is a placeholder for additional functionality
          </p>
        </div>
        
        <div className="max-w-md mx-auto bg-white rounded-xl border border-purple-100/30 shadow-sm p-6">
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13c-1.168-.775-2.754-1.253-4.5-1.253-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-medium text-gray-800 mb-2">Content Coming Soon</h2>
            <p className="text-gray-600 text-center mb-6">
              This page is a placeholder for future functionality.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
              focus:ring-2 focus:ring-purple-200 focus:ring-offset-2
              transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecondPage;
