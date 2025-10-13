import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Friends from './pages/Friends'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import AddEncounter from './pages/AddEncounter'
import EditEncounter from './pages/EditEncounter'
import TestRunner from './components/TestRunner'

type Page = 'dashboard' | 'timeline' | 'friends' | 'analytics' | 'settings' | 'add' | 'tests' | string

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    // Handle edit-encounter routes
    if (currentPage.startsWith('edit-encounter/')) {
      const encounterIdStr = currentPage.split('/')[1];
      const encounterId = parseInt(encounterIdStr);
      
      if (isNaN(encounterId)) {
        return <div className="p-4 text-red-500">Invalid encounter ID</div>;
      }
      
      return <EditEncounter onNavigate={navigate} encounterId={encounterId} />
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />
      case 'timeline':
        return <Timeline onNavigate={navigate} />
      case 'friends':
        return <Friends onNavigate={navigate} />
      case 'analytics':
        return <Analytics onNavigate={navigate} />
      case 'settings':
        return <Settings onNavigate={navigate} />
      case 'add':
        return <AddEncounter onNavigate={navigate} />
      case 'tests':
        return <TestRunner />
      default:
        return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md mx-auto min-h-screen shadow-xl relative transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pt-12 sticky top-0 z-10 shadow-lg rounded-b-3xl">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Encounter Ledger</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`p-2 rounded-full transition-all ${
                  currentPage === 'settings'
                  ? 'bg-white/20 text-white'
                  : 'hover:bg-white/10'
              }`}
            >
              <span className="text-xl">⚙️</span>
            </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-24 min-h-[calc(100vh-200px)]">
          {renderPage()}
        </main>

        {/* Bottom Navigation */}
        <nav className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md backdrop-blur-lg border-t shadow-2xl rounded-t-3xl transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700' 
            : 'bg-white/95 border-gray-100'
        }`}>
          <div className="flex justify-around items-center px-4 py-3 pt-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                currentPage === 'dashboard' 
                  ? 'text-blue-600 bg-blue-50 scale-105 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span className="text-2xl mb-1">🏠</span>
              <span className="text-xs font-semibold">Home</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('timeline')}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                currentPage === 'timeline' 
                  ? 'text-blue-600 bg-blue-50 scale-105 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span className="text-2xl mb-1">📅</span>
              <span className="text-xs font-semibold">Timeline</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('add')}
              className="flex flex-col items-center py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transform scale-110 hover:shadow-2xl hover:scale-115 active:scale-105 transition-all duration-300"
            >
              <span className="text-2xl mb-1">➕</span>
              <span className="text-xs font-bold">Add</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('friends')}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                currentPage === 'friends' 
                  ? 'text-blue-600 bg-blue-50 scale-105 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span className="text-2xl mb-1">👥</span>
              <span className="text-xs font-semibold">Friends</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('analytics')}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                currentPage === 'analytics' 
                  ? 'text-blue-600 bg-blue-50 scale-105 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span className="text-2xl mb-1">📊</span>
              <span className="text-xs font-semibold">Stats</span>
            </button>
          </div>
          <div className="h-1 bg-gray-100 rounded-full mx-8 mb-2"></div>
        </nav>
      </div>
    </div>
  )
}

export default App
