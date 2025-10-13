import { useState } from 'react';

interface HelpProps {
  onNavigate: (page: string) => void;
}

export default function Help({ onNavigate }: HelpProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const HelpSection = ({ 
    id, 
    title, 
    icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: string; 
    children: React.ReactNode;
  }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">{icon}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <span className={`text-2xl text-gray-400 transition-transform duration-200 ${
          activeSection === id ? 'rotate-180' : ''
        }`}>
          ↓
        </span>
      </button>
      
      {activeSection === id && (
        <div className="px-4 pb-4">
          <div className="border-t pt-4 space-y-4 text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mr-4"
        >
          <span className="text-xl">←</span>
        </button>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl">📖</span>
        </div>
        <div className="ml-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">Help & Guide</h2>
          <p className="text-gray-600 dark:text-gray-400">Your complete app manual</p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-3xl">🏳️‍🌈</span>
          <h1 className="text-2xl font-bold">The Load Down</h1>
        </div>
        <p className="text-blue-100 leading-relaxed">
          Your Legendary Gay Sex Life Dashboard - The most EXTRA Progressive Web App for logging, 
          tracking, and absolutely SERVING your intimate adventures with complete discretion.
        </p>
      </div>

      {/* About Section */}
      <HelpSection id="about" title="About The Load Down" icon="🌟">
        <div className="space-y-4">
          <p>
            <strong>Congratulations!</strong> You've installed the most ICONIC, privacy-obsessed, 
            iPhone-exclusive Progressive Web App designed for the gays who want to track, analyze, 
            and absolutely CELEBRATE their legendary conquests with complete discretion.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ iPhone Exclusive Notice</h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              This app was designed exclusively for and tested only on iPhones (aka the official gay phone). 
              We love our Android gays, but this queen only speaks iOS. 📱✨
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-lg">🌈 Core Philosophy</h4>
            <div className="grid gap-3">
              <div className="flex items-start space-x-3">
                <span className="text-xl">🔒</span>
                <div>
                  <div className="font-medium">Privacy by Design</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your tea stays YOUR tea, period</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">✈️</span>
                <div>
                  <div className="font-medium">Offline-First</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Works in airplane mode because we know you travel for dick</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">🌈</span>
                <div>
                  <div className="font-medium">Gay-Positive</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Celebrates getting your back blown out with zero judgment and maximum celebration</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">🎮</span>
                <div>
                  <div className="font-medium">Gamified Experience</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Turn your conquests into a legendary dashboard that would make RuPaul proud</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Getting Started */}
      <HelpSection id="setup" title="Getting Started Guide" icon="📱">
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">✅ Already Installed!</h4>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Since you're reading this, you've already successfully installed the app. Great job! 
              Here's what you can track:
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-lg">🍆 What You Can Track</h4>
            <div className="grid gap-3">
              <div className="flex items-start space-x-3">
                <span className="text-xl">👥</span>
                <div>
                  <div className="font-medium">Your Roster</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Comprehensive profiles of all your boys with thirst traps and tea</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">💥</span>
                <div>
                  <div className="font-medium">Encounter Details</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Every legendary session with ratings, duration, and who got DEMOLISHED</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">📊</span>
                <div>
                  <div className="font-medium">Performance Analytics</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Statistics that would make Kinsey blush, served with MAXIMUM attitude</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">💰</span>
                <div>
                  <div className="font-medium">Money Moves</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Track your sugar daddy moments and OnlyFans contributions</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-xl">🏥</span>
                <div>
                  <div className="font-medium">Safety Accountability</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">PrEP tracking and rubber accountability (because we're responsible sluts)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Security & Privacy */}
      <HelpSection id="security" title="Security & Privacy" icon="🔐">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">🛡️ Fort Knox for Your Tea</h4>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Your intimate data is protected with military-grade security. Your business is YOUR business!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-3">🔒 PIN Lock System</h4>
              <div className="space-y-2 text-sm">
                <p><strong>4+ Digit Protection:</strong> Because your tea deserves better than 1234 (we see you, basic gays)</p>
                <p><strong>Face ID Integration:</strong> Let your iPhone recognize your post-nut glow for instant access</p>
                <p><strong>Auto-Lock Timer:</strong> Locks automatically when you inevitably get distracted by other apps (1min - 1hour)</p>
                <p><strong>Panic Lock Button:</strong> Hit this faster than you'd block your ex on everything</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3">👤 Biometric Authentication</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Face ID:</strong> Your beautiful gay face IS the key</p>
                <p><strong>Touch ID:</strong> For the older gayphones that still serve</p>
                <p><strong>Fallback Protection:</strong> PIN backup when you're too drunk for Face ID</p>
                <p><strong>Smart Recognition:</strong> Works even with your makeup looking ROUGH</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3">🛡️ Privacy That Would Make the CIA Jealous</h4>
              <div className="space-y-2 text-sm">
                <p><strong>No Backend:</strong> Absolutely no server snooping on your gay business</p>
                <p><strong>No Tracking:</strong> Zero analytics, telemetry, or Big Brother nonsense</p>
                <p><strong>No Accounts:</strong> No registration, no login, no "verify your email" bullshit</p>
                <p><strong>No Network:</strong> Works 100% offline because airplane mode is for more than just flying</p>
                <p><strong>Everything Stays Local:</strong> Your receipts stay on YOUR gayphone where they belong</p>
                <p><strong>AES-256 Encryption:</strong> For exported backups (because paranoia is healthy)</p>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Understanding Dashboard */}
      <HelpSection id="dashboard" title="Understanding Your Dashboard" icon="📊">
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <h4 className="font-bold text-purple-800 dark:text-purple-200 mb-2">🔥 Your Gay Sex Life Statistics</h4>
            <p className="text-purple-700 dark:text-purple-300 text-sm">
              Served with MAXIMUM Attitude - Analytics that would make Kinsey proud!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-3">📈 Performance Metrics</h4>
              <div className="grid gap-3">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <div className="font-medium">Top 10 Performers</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Your hall of fame ranked by a gay algorithm that knows what's up</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <div className="font-medium">Conquest Timeline</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Chronological list of your legendary sessions</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-xl">⭐</span>
                  <div>
                    <div className="font-medium">Rating Analysis</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Who brought the FIRE and who was... mid</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-xl">💰</span>
                  <div>
                    <div className="font-medium">Sugar Tracking</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Financial analysis with personality ("You EARNED $420 - rent is paid, queen!")</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <h4 className="font-bold mb-2">🧮 The Gay Scoring Algorithm™</h4>
              <div className="font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                Final Score = (0.35 × How Often) + (0.25 × How Recent) + <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.30 × How Good) + (0.10 × Mutual Satisfaction)
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <em>All weights fully customizable in Settings because every gay has different priorities</em>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3">💬 Analytics That Actually Matter</h4>
              <div className="space-y-2 text-sm">
                <p><strong>"You're clearly popular!"</strong> - Frequency analysis with attitude</p>
                <p><strong>"Still serving at your age!"</strong> - Performance trends over time</p>
                <p><strong>"That's some expensive taste, hunny"</strong> - Financial impact analysis</p>
                <p><strong>"Your legendary sex life"</strong> - Because confidence is everything</p>
                <p><strong>"Money moves only"</strong> - Sugar daddy ROI calculations</p>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Daily Usage Tips */}
      <HelpSection id="usage" title="Daily Usage Tips" icon="🔄">
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-lg mb-3">🌅 Morning Routine (Post-Hookup Analysis)</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-lg">🔍</span>
                <div>
                  <div className="font-medium">Quick Add</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Log that new conquest faster than you can say "his name was..."</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">📊</span>
                <div>
                  <div className="font-medium">Check Stats</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Admire your legendary dashboard and feel your power</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">👥</span>
                <div>
                  <div className="font-medium">Browse Roster</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">See which boys you've been neglecting lately</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">🏆</span>
                <div>
                  <div className="font-medium">Track Progress</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Watch your rankings shift like the gay drama you live for</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3">🌙 Evening Review (Tea Time)</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="text-lg">📱</span>
                <div>
                  <div className="font-medium">Update Profiles</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Add new thirst traps and update hosting situations</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">💰</span>
                <div>
                  <div className="font-medium">Log Payments</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Record any sugar daddy transactions or OF tips</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">📈</span>
                <div>
                  <div className="font-medium">Analyze Trends</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">See who's been serving and who's been lacking</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="font-medium">Plan Tomorrow</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Use insights to decide who deserves your attention</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3">📅 Weekly Gay Rituals</h4>
            <div className="space-y-2 text-sm">
              <p><strong>📊 Dashboard Deep Dive:</strong> Analyze all your legendary statistics</p>
              <p><strong>💾 Backup Your Receipts:</strong> Export your data (encrypted, obviously)</p>
              <p><strong>🧹 Contact Cleanup:</strong> Archive the ones who didn't make the cut</p>
              <p><strong>🎯 Goal Setting:</strong> Plan your conquest strategy for the week</p>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Backup & Export */}
      <HelpSection id="backup" title="Backup & Data Export" icon="💾">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">📤 Export Options</h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Because Receipts are Forever - Multiple formats for different needs
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-3">📄 JSON Format (For the Tech Gays)</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Complete Data:</strong> Every detail with full structure</p>
                <p><strong>Re-importable:</strong> Perfect for switching to a new gayphone</p>
                <p><strong>File Size:</strong> Usually 1-5MB (your sex life is efficient)</p>
                <p><strong>Use Case:</strong> Device migration, complete backups</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3">📊 CSV Format (For the Excel Queens)</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Spreadsheet Ready:</strong> Open in Numbers, Excel, Google Sheets</p>
                <p><strong>Analysis Friendly:</strong> Create your own charts and pivot tables</p>
                <p><strong>Shareable:</strong> Send to your therapist or data analyst bestie</p>
                <p><strong>Use Case:</strong> External analysis, relationship counseling data</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-3">🔐 Encrypted Backup (For the Paranoid Gays)</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Password Protected:</strong> AES-256 encryption with your password</p>
                <p><strong>Cloud Safe:</strong> Encrypted files are safe for iCloud, Google Drive, Dropbox</p>
                <p><strong>Discrete:</strong> Looks like any other encrypted file</p>
                <p><strong>Use Case:</strong> Regular backups to cloud storage</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <h4 className="font-bold mb-3">💾 The Gay Backup Strategy</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Weekly:</strong> Quick JSON export to secure location</p>
                <p><strong>Monthly:</strong> Encrypted backup to multiple cloud services</p>
                <p><strong>Quarterly:</strong> Full backup with analytics reports to external drive</p>
                <p><strong>Annually:</strong> Archive backup with year-end "best of" statistics</p>
                <p><strong>Before Travel:</strong> Backup to offline storage (airports are risky)</p>
                <p><strong>Before Phone Upgrade:</strong> MULTIPLE backups in MULTIPLE formats</p>
              </div>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Technical Details */}
      <HelpSection id="technical" title="Technical Details" icon="🛠️">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h4 className="font-bold text-lg mb-3">💻 Frontend Excellence</h4>
            <div className="space-y-2 text-sm">
              <p><strong>⚛️ React 18:</strong> The gay-friendly JavaScript framework with hooks and sass</p>
              <p><strong>🔷 TypeScript:</strong> Type safety because we don't do sloppy coding</p>
              <p><strong>⚡ Vite:</strong> Build tool faster than your refractory period</p>
              <p><strong>🎨 Tailwind CSS:</strong> Utility-first styling for maximum gay aesthetics</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h4 className="font-bold text-lg mb-3">🗄️ Data Layer Realness</h4>
            <div className="space-y-2 text-sm">
              <p><strong>📦 Dexie.js:</strong> IndexedDB wrapper that actually makes sense</p>
              <p><strong>🏠 Local-First:</strong> Zero external dependencies (independence, hunny)</p>
              <p><strong>🔄 Real-Time:</strong> Live updates across all components</p>
              <p><strong>📊 Computed Analytics:</strong> Statistics calculated faster than you can bottom</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h4 className="font-bold text-lg mb-3">📱 PWA Features That Serve</h4>
            <div className="space-y-2 text-sm">
              <p><strong>🏠 Home Screen Install:</strong> Native app vibes without App Store drama</p>
              <p><strong>✈️ Offline Capable:</strong> Works in airplane mode and dead zones</p>
              <p><strong>🔄 Auto-Updates:</strong> New features appear magically (with consent)</p>
              <p><strong>🔔 Push Notifications:</strong> Optional thirst alerts and reminders</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
            <h4 className="font-bold text-lg mb-3">🔐 Security Implementation</h4>
            <div className="space-y-2 text-sm">
              <p><strong>🔑 Web Crypto API:</strong> Browser-native cryptographic operations</p>
              <p><strong>👤 WebAuthn:</strong> Modern biometric authentication standards</p>
              <p><strong>🛡️ Content Security Policy:</strong> XSS protection that actually works</p>
              <p><strong>🔒 HTTPS-Only:</strong> Because we're not animals</p>
            </div>
          </div>
        </div>
      </HelpSection>

      {/* Legal & Safety */}
      <HelpSection id="legal" title="Legal & Safety" icon="⚖️">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">🔞 Age Restriction (Obviously)</h4>
            <p className="text-red-700 dark:text-red-300 text-sm">
              This app is for adults only. If you're under 18, go do your homework and come back when you're legal.
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-200 dark:border-pink-800">
            <h4 className="font-bold text-pink-800 dark:text-pink-200 mb-2">💖 Consent is Everything</h4>
            <p className="text-pink-700 dark:text-pink-300 text-sm">
              Only log encounters with consenting adults who are aware and okay with being tracked. Don't be creepy.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-3">👑 Your Responsibility, Hunny</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Legal Compliance:</strong> Make sure your activities are legal where you are</p>
              <p><strong>Data Security:</strong> Keep your gayphone locked and backups encrypted</p>
              <p><strong>Respect Privacy:</strong> Don't share other people's info without permission</p>
              <p><strong>Be Safe:</strong> Use protection and get tested regularly (we care about you)</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ No Warranty (Sorry Not Sorry)</h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              This app is provided "as-is" without any guarantees. We built it with love, but shit happens.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">📜 MIT License (The Good Kind of Legal)</h4>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Free to use, modify, and distribute. Just don't claim you built it (we know you didn't).
            </p>
          </div>
        </div>
      </HelpSection>

      {/* Ready to Serve */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="text-center space-y-3">
          <span className="text-4xl">🔥</span>
          <h3 className="text-xl font-bold">Ready to Serve?</h3>
          <p className="text-pink-100 leading-relaxed">
            You're ready to track your legendary sex life with the most EXTRA analytics dashboard ever built!
            Start celebrating your intimate adventures with complete privacy and absolutely ICONIC insights!
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-4 px-6 py-3 bg-white text-purple-700 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            🏠 Go to Dashboard
          </button>
        </div>
      </div>

      {/* Final Notes */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 text-center">
        <div className="space-y-3">
          <span className="text-3xl">💅</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Final Notes</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            This gay masterpiece was built with ❤️, TypeScript, and an unhealthy obsession with both privacy and serving looks.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            <strong>P.S.</strong> - If you're still reading this, you're probably gay enough to appreciate good documentation. 
            You won't regret using this app. 💅✨
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-600 mt-4">
            Help Guide | Last updated: October 2024
          </div>
        </div>
      </div>
    </div>
  );
}