import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Friends from './pages/Friends'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Help from './pages/Help'
import AddEncounter from './pages/AddEncounter'
import EditEncounter from './pages/EditEncounter'
import TestRunner from './components/TestRunner'
import UnlockScreen from './components/UnlockScreen'
import { requiresUnlock, updateLastActivity, shouldAutoLock, lockSession } from './utils/security'
import { useAnalytics } from './utils/analytics'
import { generateRealisticSampleData } from './db/sampleData'

type Page = 'dashboard' | 'timeline' | 'friends' | 'analytics' | 'settings' | 'help' | 'add' | 'tests' | string

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [isGayMode, setIsGayMode] = useState(() => {
    const saved = localStorage.getItem('gayMode')
    return saved ? JSON.parse(saved) : false
  })
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(true)
  
  // Analytics tracking
  const { trackPageView, trackInteraction } = useAnalytics()

  // Track page views
  useEffect(() => {
    trackPageView(currentPage)
  }, [currentPage, trackPageView])

  // Check security status on app start
  useEffect(() => {
    const checkSecurity = () => {
      const needsAuth = requiresUnlock()
      setNeedsUnlock(needsAuth)
      setIsUnlocked(!needsAuth)
    }
    
    checkSecurity()
  }, [])

  // Update activity and check auto-lock periodically
  useEffect(() => {
    let autoLockTimer: number

    if (isUnlocked) {
      // Update activity on user interactions
      const handleActivity = () => {
        updateLastActivity()
      }

      // Listen for user activity
      window.addEventListener('mousedown', handleActivity)
      window.addEventListener('keydown', handleActivity)
      window.addEventListener('touchstart', handleActivity)
      window.addEventListener('scroll', handleActivity)

      // Check for auto-lock every 30 seconds
      autoLockTimer = window.setInterval(() => {
        if (shouldAutoLock()) {
          lockSession()
          setIsUnlocked(false)
          setNeedsUnlock(true)
        }
      }, 30000)

      return () => {
        window.removeEventListener('mousedown', handleActivity)
        window.removeEventListener('keydown', handleActivity)
        window.removeEventListener('touchstart', handleActivity)
        window.removeEventListener('scroll', handleActivity)
        clearInterval(autoLockTimer)
      }
    }
  }, [isUnlocked])

  const handleUnlocked = () => {
    setIsUnlocked(true)
    setNeedsUnlock(false)
    updateLastActivity()
  }

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Gay mode effect 🏳️‍🌈
  useEffect(() => {
    localStorage.setItem('gayMode', JSON.stringify(isGayMode))
    if (isGayMode) {
      document.documentElement.classList.add('gay-mode')
    } else {
      document.documentElement.classList.remove('gay-mode')
    }
  }, [isGayMode])

  // Demo mode initialization
  useEffect(() => {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
    const demoSessionId = sessionStorage.getItem('demo-session-id')
    const currentSessionId = Date.now().toString()
    
    if (isDemoMode && !demoSessionId) {
      // Auto-initialize demo data on first load of session
      const initializeDemo = async () => {
        try {
          console.log('🎭 Demo mode detected - loading sample data...')
          await generateRealisticSampleData()
          sessionStorage.setItem('demo-session-id', currentSessionId)
          
          // Bypass security for demo
          setIsUnlocked(true)
          setNeedsUnlock(false)
          
          console.log('✅ Demo data loaded successfully!')
          console.log('📊 Demo includes: 65 friends, 221 encounters with realistic data')
        } catch (error) {
          console.error('❌ Failed to load demo data:', error)
        }
      }
      
      initializeDemo()
    } else if (isDemoMode) {
      // Already initialized, just bypass security
      setIsUnlocked(true)
      setNeedsUnlock(false)
    }
  }, [])

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockApp = () => {
    lockSession();
    setIsUnlocked(false);
    setNeedsUnlock(true);
    trackInteraction('lock-app');
  };

  const handleTitleClick = () => {
    navigate('dashboard');
    trackInteraction('nav-title-home');
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
    
    // Handle friends routes (friends/id)
    if (currentPage.startsWith('friends/')) {
      const friendIdStr = currentPage.split('/')[1];
      const friendId = parseInt(friendIdStr);
      
      if (isNaN(friendId)) {
        return <div className="p-4 text-red-500">Invalid friend ID</div>;
      }
      
      return <Friends onNavigate={navigate} selectedFriendId={friendId} />
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} isDarkMode={isDarkMode} isGayMode={isGayMode} />
      case 'timeline':
        return <Timeline onNavigate={navigate} />
      case 'friends':
        return <Friends onNavigate={navigate} />
      case 'friends-add':
        return <Friends onNavigate={navigate} showAddFormInitially={true} />
      case 'analytics':
        return <Analytics onNavigate={navigate} isDarkMode={isDarkMode} isGayMode={isGayMode} />
      case 'settings':
        return <Settings onNavigate={navigate} />
      case 'help':
        return <Help onNavigate={navigate} />
      case 'add':
        return <AddEncounter onNavigate={navigate} />
      case 'tests':
        return <TestRunner />
      default:
        return <Dashboard onNavigate={navigate} isDarkMode={isDarkMode} isGayMode={isGayMode} />
    }
  }

  // Show unlock screen if security is required
  if (needsUnlock) {
    return <UnlockScreen onUnlocked={handleUnlocked} />
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
      isGayMode 
        ? 'bg-gradient-to-br from-pink-200 via-purple-200 via-blue-200 via-cyan-200 to-yellow-200' 
        : isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-3">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      
      {/* Main App Container */}
      <div className={`max-w-md mx-auto min-h-screen shadow-2xl relative transition-colors duration-300 backdrop-blur-xl border-x ${
        isGayMode 
          ? 'bg-gradient-to-b from-pink-50/90 via-purple-50/90 to-cyan-50/90 border-pink-300/30' 
          : isDarkMode 
            ? 'bg-gray-800/80 border-gray-700/30' 
            : 'bg-white/80 border-white/20'
      }`}>
        {/* Static orbs - no animations for better performance */}
        
        <div className={`absolute top-20 left-4 w-12 h-12 rounded-full blur-lg ${
          isGayMode 
            ? 'bg-gradient-to-br from-red-500/30 to-pink-600/30' 
            : 'bg-gradient-to-br from-blue-400/15 to-purple-600/15'
        }`}></div>
        <div className={`absolute top-40 right-4 w-10 h-10 rounded-full blur-md ${
          isGayMode 
            ? 'bg-gradient-to-br from-yellow-500/30 to-orange-600/30' 
            : 'bg-gradient-to-br from-emerald-400/15 to-teal-600/15'
        }`}></div>
        <div className={`absolute top-60 left-6 w-8 h-8 rounded-full blur-sm ${
          isGayMode 
            ? 'bg-gradient-to-br from-purple-500/30 to-indigo-600/30' 
            : 'bg-gradient-to-br from-pink-400/15 to-rose-600/15'
        }`}></div>
        <div className={`absolute top-80 right-6 w-14 h-14 rounded-full blur-lg ${
          isGayMode 
            ? 'bg-gradient-to-br from-green-500/25 to-cyan-600/25' 
            : 'bg-gradient-to-br from-amber-400/12 to-orange-600/12'
        }`}></div>
        
        {isGayMode && (
          <>
            {/* Pride rainbow orbs - only visible in gay mode */}
            <div className="absolute top-32 right-8 w-6 h-6 bg-gradient-to-br from-cyan-500/25 to-blue-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-72 left-8 w-16 h-16 bg-gradient-to-br from-pink-400/30 to-rose-600/30 rounded-full blur-xl"></div>
            <div className="absolute top-52 left-2 w-7 h-7 bg-gradient-to-br from-lime-500/25 to-green-600/25 rounded-full blur-sm"></div>
            
            {/* Additional pride orbs */}
            <div className="absolute top-16 right-12 w-9 h-9 bg-gradient-to-br from-violet-500/30 to-purple-600/30 rounded-full blur-md"></div>
            <div className="absolute top-36 left-12 w-5 h-5 bg-gradient-to-br from-orange-500/25 to-red-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-64 right-2 w-11 h-11 bg-gradient-to-br from-indigo-500/30 to-blue-700/30 rounded-full blur-lg"></div>
            <div className="absolute top-24 left-16 w-4 h-4 bg-gradient-to-br from-emerald-500/25 to-teal-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-48 right-16 w-8 h-8 bg-gradient-to-br from-rose-500/30 to-pink-700/30 rounded-full blur-md"></div>
            <div className="absolute top-56 left-10 w-6 h-6 bg-gradient-to-br from-amber-500/25 to-yellow-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-76 right-10 w-13 h-13 bg-gradient-to-br from-fuchsia-500/30 to-purple-700/30 rounded-full blur-lg"></div>
            <div className="absolute top-28 left-20 w-3 h-3 bg-gradient-to-br from-sky-500/25 to-blue-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-44 right-20 w-10 h-10 bg-gradient-to-br from-red-500/30 to-orange-600/30 rounded-full blur-md"></div>
            <div className="absolute top-68 left-14 w-7 h-7 bg-gradient-to-br from-green-500/25 to-emerald-600/25 rounded-full blur-sm"></div>
            <div className="absolute top-84 right-14 w-12 h-12 bg-gradient-to-br from-purple-500/30 to-indigo-700/30 rounded-full blur-lg"></div>
            <div className="absolute top-12 left-6 w-5 h-5 bg-gradient-to-br from-pink-500/25 to-rose-600/25 rounded-full blur-sm"></div>
          </>
        )}
        {/* Header */}
        <header className={`sticky top-0 z-40 border-b backdrop-blur-xl shadow-lg transition-colors duration-300 ${
          isGayMode
            ? 'bg-gradient-to-r from-pink-100/95 via-purple-100/95 to-cyan-100/95 border-pink-200/50'
            : isDarkMode 
              ? 'bg-gray-800/90 border-gray-700/50' 
              : 'bg-white/90 border-gray-200/50'
        }`}>
          <div className="flex justify-between items-center px-6 py-4">
            <h1 
              onClick={handleTitleClick}
              className={`text-xl font-bold bg-gradient-to-r cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              isGayMode 
                ? 'from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-700 hover:via-purple-700 hover:to-cyan-700' 
                : isDarkMode 
                  ? 'from-white via-gray-100 to-gray-300 hover:from-gray-100 hover:via-gray-200 hover:to-gray-400' 
                  : 'from-gray-900 via-gray-800 to-gray-600 hover:from-gray-800 hover:via-gray-700 hover:to-gray-500'
            } bg-clip-text text-transparent drop-shadow-sm`}
              title="Go to Dashboard"
            >
              The Load Down {isGayMode ? '🏳️‍🌈' : ''}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLockApp}
                className={`p-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
                  isDarkMode 
                    ? 'hover:bg-red-700/80 text-red-400 bg-gray-800/60 border-red-600/50 hover:border-red-500/50' 
                    : 'hover:bg-red-100/80 text-red-600 bg-white/60 border-red-200/50 hover:border-red-300/50'
                }`}
                title="Lock App"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  // Don't allow dark mode while gay mode is active
                  if (!isGayMode) {
                    setIsDarkMode(!isDarkMode);
                  }
                }}
                className={`p-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
                  isGayMode
                    ? 'opacity-50 cursor-not-allowed bg-gray-200/60 text-gray-400 border-gray-300/50'
                    : isDarkMode 
                      ? 'hover:bg-gray-700/80 text-gray-300 bg-gray-800/60 border-gray-600/50' 
                      : 'hover:bg-gray-100/80 text-gray-600 bg-white/60 border-gray-200/50'
                }`}
                title={isGayMode ? "Dark mode disabled in Gay Mode 🏳️‍🌈" : "Toggle Dark Mode"}
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  const newGayMode = !isGayMode;
                  setIsGayMode(newGayMode);
                  // Gay mode should always use light mode for better pride color visibility
                  if (newGayMode && isDarkMode) {
                    setIsDarkMode(false);
                  }
                }}
                className={`p-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
                  isGayMode
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400/50 shadow-pink-500/30'
                    : isDarkMode 
                      ? 'hover:bg-gray-700/80 text-gray-300 bg-gray-800/60 border-gray-600/50' 
                      : 'hover:bg-gray-100/80 text-gray-600 bg-white/60 border-gray-200/50'
                }`}
                title="Toggle Gay Mode 🏳️‍🌈"
              >
                {isGayMode ? '🏳️‍🌈' : '💖'}
              </button>
              <button
                onClick={() => navigate('settings')}
                className={`p-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
                  currentPage === 'settings'
                    ? isDarkMode ? 'bg-blue-600/80 text-white border-blue-500/50 shadow-blue-500/30' : 'bg-blue-600/80 text-white border-blue-500/50 shadow-blue-500/30'
                    : isDarkMode ? 'hover:bg-gray-700/80 text-gray-300 bg-gray-800/60 border-gray-600/50' : 'hover:bg-gray-100/80 text-gray-600 bg-white/60 border-gray-200/50'
                }`}
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-32 min-h-[calc(100vh-140px)] overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Fixed Bottom Navigation - Outside main container */}
      <nav className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md backdrop-blur-3xl border-t border-x shadow-2xl rounded-t-3xl transition-colors duration-300 z-50 ${
        isGayMode
          ? 'bg-gradient-to-r from-pink-100/95 via-purple-100/95 to-cyan-100/95 border-pink-200'
          : isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-around items-center px-6 py-3 pt-4">
          <button
            onClick={() => {
              navigate('dashboard')
              trackInteraction('nav-dashboard')
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 shadow-md backdrop-blur-sm ${
              currentPage === 'dashboard' 
                ? isGayMode
                  ? 'text-white bg-gradient-to-r from-pink-500 to-purple-600 scale-105 shadow-pink-500/30 border border-pink-400/50' 
                  : 'text-blue-600 bg-blue-50/80 dark:bg-blue-900/30 scale-105 shadow-blue-500/30 border border-blue-200/50 dark:border-blue-700/50'
                : isGayMode
                  ? 'text-purple-600 hover:text-white dark:text-purple-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-500 active:scale-95 border border-transparent hover:border-pink-300/50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 active:scale-95 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => navigate('timeline')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 shadow-md backdrop-blur-sm ${
              currentPage === 'timeline' 
                ? isGayMode
                  ? 'text-white bg-gradient-to-r from-orange-500 to-red-600 scale-105 shadow-orange-500/30 border border-orange-400/50' 
                  : 'text-blue-600 bg-blue-50/80 dark:bg-blue-900/30 scale-105 shadow-blue-500/30 border border-blue-200/50 dark:border-blue-700/50'
                : isGayMode
                  ? 'text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-orange-400 hover:to-red-500 active:scale-95 border border-transparent hover:border-orange-300/50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 active:scale-95 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Timeline</span>
          </button>
          
          <button
            onClick={() => navigate('friends')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 shadow-md backdrop-blur-sm ${
              currentPage === 'friends' 
                ? isGayMode
                  ? 'text-white bg-gradient-to-r from-green-500 to-teal-600 scale-105 shadow-green-500/30 border border-green-400/50' 
                  : 'text-blue-600 bg-blue-50/80 dark:bg-blue-900/30 scale-105 shadow-blue-500/30 border border-blue-200/50 dark:border-blue-700/50'
                : isGayMode
                  ? 'text-green-600 hover:text-white dark:text-green-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-green-400 hover:to-teal-500 active:scale-95 border border-transparent hover:border-green-300/50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 active:scale-95 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-medium">Friends</span>
          </button>
          
          <button
            onClick={() => navigate('analytics')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 shadow-md backdrop-blur-sm ${
              currentPage === 'analytics' 
                ? isGayMode
                  ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-600 scale-105 shadow-blue-500/30 border border-blue-400/50' 
                  : 'text-blue-600 bg-blue-50/80 dark:bg-blue-900/30 scale-105 shadow-blue-500/30 border border-blue-200/50 dark:border-blue-700/50'
                : isGayMode
                  ? 'text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-cyan-500 active:scale-95 border border-transparent hover:border-blue-300/50'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 active:scale-95 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
        <div className={`h-1 rounded-full mx-8 mb-3 ${isDarkMode ? 'bg-gray-600/50' : 'bg-gray-200/50'}`}></div>
      </nav>
    </div>
  )
}

export default App
