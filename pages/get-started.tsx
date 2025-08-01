import { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Type Definitions for enhanced TypeScript support ---
interface Project {
  id: string;
  projectName: string;
  apiKey: string;
  createdAt: string;
  showKey: boolean;
}

interface UsageData {
  name: string;
  calls: number;
}

interface UserStripeData {
    userId: string;
    stripeCustomerId: string;
    subscriptionId: string;
    status: string;
    current_period_end: string;
}

// --- Firebase Configuration & Initialization ---
// @ts-ignore
const firebaseConfig = typeof window !== 'undefined' && (window as any).__firebase_config
  ? JSON.parse((window as any).__firebase_config)
  : {};
const __initial_auth_token = typeof window !== 'undefined' && (window as any).__initial_auth_token !== undefined
  ? (window as any).__initial_auth_token
  : undefined;
const __app_id = 'default-app-id';

// --- Main Application Component ---
const App = () => {
  // State variables for the application's UI and data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegenModal, setShowRegenModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showBillingPortalModal, setShowBillingPortalModal] = useState(false);
  const [showStripeErrorModal, setShowStripeErrorModal] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [usageData, setUsageData] = useState({ count: 0, plan: 'Free', limit: 3 });
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sdkSnippetTab, setSdkSnippetTab] = useState('javascript');
  
  // State for mock user and Stripe data
  const [user, setUser] = useState<{ id: string | null; email: string | null }>({ id: null, email: null });
  const [stripeData, setStripeData] = useState<UserStripeData>({
      userId: 'abc123',
      stripeCustomerId: 'cus_mock',
      subscriptionId: 'sub_mock',
      status: 'free', // 'free' or 'active'
      current_period_end: '2025-08-30'
  });

  // State variables for Firebase authentication and database
  const [userId, setUserId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState('Authenticating...');
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  
  const isProUser = stripeData.status === 'active';

  // Memoized mock data for the usage graph
  const mockUsageGraphData: UsageData[] = useMemo(() => {
    return [
      { name: 'Mon', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Tue', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Wed', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Thu', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Fri', calls: Math.random() * 500 + 100 },
      { name: 'Sat', calls: Math.random() * 500 + 100 },
      { name: 'Sun', calls: Math.random() * 500 + 100 },
    ];
  }, []);

  // --- Utility Functions ---
  const addLog = (message: string) => {
    setErrorLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const generateNewApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = '';
    for (let i = 0; i < 48; i++) {
      if (i > 0 && i % 12 === 0) newKey += '-';
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return newKey;
  };

  const copyToClipboard = (key: string) => {
    if (key) {
      document.execCommand('copy');
      addLog('🔐 API key copied to clipboard!');
    }
  };

  // --- Stripe Logic ---
  const handleUpgrade = async () => {
    addLog('Attempting to create Stripe checkout session...');
    // This is a mock fetch call to simulate the user's backend logic.
    // In a real app, this would hit their actual API endpoint.
    try {
      // Simulate API call
      const res = await new Promise(resolve => setTimeout(() => {
        // Mock a successful response with a redirect URL
        resolve({
          json: () => Promise.resolve({ url: 'https://checkout.stripe.com/mock-session-id' })
        });
      }, 1500));

      const data = await (res as any).json();
      if (data?.url) {
        // Instead of redirecting, we show a modal to represent success
        addLog('✅ Stripe session created, redirecting...');
        setShowBillingPortalModal(true);
        // This is where window.location.href = data.url would go
      } else {
        setShowStripeErrorModal('Failed to create Stripe session. Please try again.');
        addLog('❌ Failed to create Stripe session.');
      }
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      setShowStripeErrorModal('An error occurred. Please check your network connection.');
      addLog('❌ Stripe session creation failed due to an error.');
    }
  };

  const handleManageBilling = async () => {
    addLog('Attempting to create Stripe billing portal session...');
    // This is a mock function for a real billing portal redirect
    // A real implementation would call a backend endpoint.
    try {
        // Simulate a successful API call
        const res = await new Promise(resolve => setTimeout(() => {
            resolve({
                json: () => Promise.resolve({ url: 'https://billing.stripe.com/mock-portal' })
            });
        }, 1500));
        
        const data = await (res as any).json();
        if (data?.url) {
            // Again, a modal replaces the redirect
            addLog('✅ Stripe billing portal created, redirecting...');
            setShowBillingPortalModal(true);
        } else {
            setShowStripeErrorModal('Failed to create billing portal session. Please try again.');
            addLog('❌ Failed to create billing portal session.');
        }
    } catch (error) {
        console.error("Error creating billing portal session:", error);
        setShowStripeErrorModal('An error occurred. Please check your network connection.');
        addLog('❌ Billing portal creation failed due to an error.');
    }
  };
  
  // --- Firestore Data Operations ---
  const createProject = async (projectName: string) => {
    if (!db || !userId) return;

    if (!isProUser && projects.length >= usageData.limit) {
      setShowStripeErrorModal(`You have reached the limit of ${usageData.limit} projects on your Free plan. Please upgrade to Pro to create more.`);
      return;
    }

    try {
      addLog(`Attempting to create new project: ${projectName}`);
      const projectRef = doc(collection(db, `/artifacts/${__app_id}/users/${userId}/projects`));
      await setDoc(projectRef, {
        projectName: projectName,
        apiKey: generateNewApiKey(),
        createdAt: new Date().toISOString(),
      });
      addLog(`✅ Project '${projectName}' created successfully.`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      addLog(`❌ Failed to create project: ${error.message}`);
    }
  };

  const regenerateKey = async (projectId: string) => {
    if (!db || !userId) return;
    try {
      addLog(`Attempting to regenerate key for project ID: ${projectId}`);
      const projectRef = doc(db, `/artifacts/${__app_id}/users/${userId}/projects`, projectId);
      await updateDoc(projectRef, { apiKey: generateNewApiKey() });
      addLog(`✅ API key regenerated for project ID: ${projectId}`);
    } catch (error: any) {
      console.error("Error regenerating key:", error);
      addLog(`❌ Failed to regenerate key: ${error.message}`);
    }
    setShowRegenModal(null);
  };

  const deleteProject = async (projectId: string) => {
    if (!db || !userId) return;
    try {
      addLog(`Attempting to delete project ID: ${projectId}`);
      const projectRef = doc(db, `/artifacts/${__app_id}/users/${userId}/projects`, projectId);
      await deleteDoc(projectRef);
      addLog(`✅ Project deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting project:", error);
      addLog(`❌ Failed to delete project: ${error.message}`);
    }
    setShowDeleteModal(null);
  };

  const renameProject = async (projectId: string, newName: string) => {
    if (!db || !userId || !newName) return;
    try {
      addLog(`Attempting to rename project ID: ${projectId} to '${newName}'`);
      const projectRef = doc(db, `/artifacts/${__app_id}/users/${userId}/projects`, projectId);
      await updateDoc(projectRef, { projectName: newName });
      addLog(`✅ Project renamed to '${newName}' successfully.`);
    } catch (error: any) {
      console.error("Error renaming project:", error);
      addLog(`❌ Failed to rename project: ${error.message}`);
    }
    setShowRenameModal(null);
    setNewProjectName('');
  };
  
  // --- Effects ---
  useEffect(() => {
    const initFirebase = async () => {
      // Guard against multiple Firebase initializations
      if (getApps().length > 0) return;

      try {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        if (__initial_auth_token) {
          await signInWithCustomToken(authInstance, __initial_auth_token);
        } else {
          await signInAnonymously(authInstance);
        }

        onAuthStateChanged(authInstance, user => {
          if (user) {
            setUserId(user.uid);
            // Mocking user email for Stripe call
            setUser({ id: user.uid, email: 'user@example.com' }); 
            setAuthStatus('✅ Authenticated');
          } else {
            setUserId('N/A');
            setAuthStatus('❌ Not Authenticated');
            setLoading(false);
          }
        });
      } catch (error: any) {
        console.error("Firebase initialization or authentication failed:", error);
        addLog(`❌ Auth failed: ${error.message}`);
        setAuthStatus('❌ Auth Failed');
        setLoading(false);
      }
    };
    initFirebase();
  }, []);

  useEffect(() => {
    if (!db || !userId) return;

    // Simulate fetching Stripe user data
    if (isProUser) {
        setUsageData({ count: projects.length, plan: 'Pro', limit: 100 });
    } else {
        setUsageData({ count: projects.length, plan: 'Free', limit: 3 });
    }
    
    addLog('Listening for projects...');
    const projectsCollectionRef = collection(db, `/artifacts/${__app_id}/users/${userId}/projects`);
    const unsubscribe = onSnapshot(projectsCollectionRef, (snapshot) => {
      const projectsData: Project[] = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id, showKey: false } as Project))
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      setProjects(projectsData);
      
      if (projectsData.length === 0) {
        addLog('No projects found, auto-creating a new project...');
        setTimeout(() => createProject("EVE Fraud Detection"), 1000);
      }
      setLoading(false);
      addLog(`✅ Found ${projectsData.length} projects.`);
    }, (error: any) => {
      console.error("Error listening to projects:", error);
      addLog(`❌ Firestore listener failed: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, refreshTrigger, isProUser]);

  // UI components
  const buttonClass = "flex-1 px-3 py-1 rounded transition-transform transform hover:scale-105 active:scale-95";
  const sectionTitleClass = "text-2xl font-semibold text-blue-400";
  const containerClass = "bg-[#0d0d0d] p-6 rounded-xl border border-gray-800 shadow-md";
  const codeBlockClass = "bg-black p-4 rounded-lg overflow-x-auto text-green-400 border border-gray-700 font-mono text-sm";
  const progressWidth = `${(projects.length / usageData.limit) * 100}%`;
  const isUsageLimitReached = projects.length >= usageData.limit;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 font-mono">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Title */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-400 tracking-tight">
            EVE Developer Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Your live project, API key, and QuickStart tools are ready.
          </p>
        </div>

        {/* Auth Info */}
        <div className={containerClass}>
          <div className="flex justify-between items-center">
            <div>
              <p><span className="text-gray-400">Status:</span> <strong>{authStatus}</strong></p>
              <p><span className="text-gray-400">User ID:</span> <span className="text-sm text-yellow-400">{userId}</span></p>
            </div>
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors text-white text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-400 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-400">Setting up your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Usage & Billing Section */}
            <div className={containerClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className={sectionTitleClass}>Usage & Billing</h2>
                  <p className="text-gray-400">Current Plan: <strong>{usageData.plan}</strong> - You can create up to {usageData.limit} projects.</p>
                </div>
                {!isProUser ? (
                  <button
                    onClick={handleUpgrade}
                    className={`${buttonClass} bg-green-600 hover:bg-green-700 mt-4 sm:mt-0 text-black`}
                  >
                    Upgrade to Pro
                  </button>
                ) : (
                    <button
                        onClick={handleManageBilling}
                        className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 mt-4 sm:mt-0 text-black`}
                    >
                        Manage Billing
                    </button>
                )}
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: progressWidth }}
                  ></div>
                </div>
                <p className="text-sm mt-2 text-gray-500">
                  {projects.length} of {usageData.limit} projects used.
                </p>
              </div>

              {/* Usage Graph */}
              <div className="mt-8 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockUsageGraphData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                    <XAxis dataKey="name" stroke="#8884d8" />
                    <YAxis stroke="#8884d8" />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="calls" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-gray-500 text-sm mt-2">Daily API Call Volume (Mock Data)</p>
            </div>

            {/* Project Section */}
            {projects.map((project) => (
              <div key={project.id} className={containerClass}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={sectionTitleClass}>{project.projectName}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNewProjectName(project.projectName);
                        setShowRenameModal(project.id);
                      }}
                      className="text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(project.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      Deactivate Key
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  This project was auto-generated to get you started with EVE Fraud Detection.
                </p>

                {/* API Key Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-2 text-gray-300">Your API Key</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full flex-1 bg-gray-900 p-4 rounded-lg font-mono break-all text-gray-100 border border-gray-700">
                      {project.showKey ? project.apiKey : `${project.apiKey.substring(0, 4)}${'\u2022'.repeat(44)}`}
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => copyToClipboard(project.apiKey)}
                          className={`${buttonClass} bg-green-600 hover:bg-green-700 text-black`}
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => setProjects(prev => prev.map(p => p.id === project.id ? { ...p, showKey: !p.showKey } : p))}
                          className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 text-black`}
                        >
                          {project.showKey ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => setShowRegenModal(project.id)}
                          className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`}
                        >
                          Regenerate
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center">
              <button
                onClick={() => createProject("New Project")}
                className={`${buttonClass} text-white ${isUsageLimitReached ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} max-w-xs`}
                disabled={isUsageLimitReached}
              >
                Create Another Project
              </button>
            </div>

            {/* QuickStart Examples (using the first project's key) */}
            {projects.length > 0 && (
              <div className={containerClass}>
                <h2 className={sectionTitleClass}>QuickStart Examples</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Make your first API call with the key from your primary project.
                </p>
                <div className="flex border-b border-gray-700 mb-4">
                    <button
                        onClick={() => setSdkSnippetTab('javascript')}
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${sdkSnippetTab === 'javascript' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                    >
                        JavaScript
                    </button>
                    <button
                        onClick={() => setSdkSnippetTab('python')}
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${sdkSnippetTab === 'python' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                    >
                        Python
                    </button>
                </div>
                {sdkSnippetTab === 'javascript' && (
                    <pre className={codeBlockClass}>
                        <code>{`const apiKey = "${projects[0].apiKey}";
const data = {
  text: "This is a suspicious message.",
  model: "eve-fraud-detection"
};

fetch('https://api.naoverse.io/v1/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
  },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(response => {
  console.log('API Response:', response);
  // Handle the response data here
})
.catch(error => {
  console.error('API Error:', error);
  // Handle any errors
});`}</code>
                    </pre>
                )}
                {sdkSnippetTab === 'python' && (
                    <pre className={codeBlockClass}>
                        <code>{`import requests
import json

api_key = "${projects[0].apiKey}"
url = "https://api.naoverse.io/v1/verify"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

payload = {
    "text": "This is a suspicious message.",
    "model": "eve-fraud-detection"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    response.raise_for_status() # Raise an exception for HTTP errors
    
    data = response.json()
    print("API Response:", data)
    
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")`}</code>
                    </pre>
                )}
              </div>
            )}

            {/* SDK & Docs Section */}
            <div className={containerClass}>
              <h2 className={sectionTitleClass}>Next Steps</h2>
              <p className="text-sm text-gray-500 mb-4">
                Dive deeper into our platform's capabilities with our documentation and SDKs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#" className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}>
                  View Full Docs
                </a>
                <a href="#" className={`${buttonClass} bg-gray-600 hover:bg-gray-700 text-white`}>
                  Explore SDKs
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Event Log Panel */}
        <div className={containerClass}>
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">Event Log</h2>
          <div className="h-40 bg-gray-900 p-4 rounded-lg overflow-y-auto text-gray-400 text-xs font-mono border border-gray-700">
            {errorLogs.length > 0 ? (
              errorLogs.map((log, index) => <div key={index}>{log}</div>)
            ) : (
              <div>No recent events.</div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showRegenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-red-400">Are you sure?</h3>
              <p className="mb-6 text-gray-300">Regenerating this key will invalidate the old one for this project. This cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => regenerateKey(showRegenModal)}
                  className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`}
                >
                  Regenerate
                </button>
                <button
                  onClick={() => setShowRegenModal(null)}
                  className={`${buttonClass} bg-gray-700 hover:bg-gray-600 text-white`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-red-400">Are you sure you want to deactivate this key?</h3>
              <p className="mb-6 text-gray-300">This will permanently delete the project and its key. This cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => deleteProject(showDeleteModal)}
                  className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`}
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className={`${buttonClass} bg-gray-700 hover:bg-gray-600 text-white`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showStripeErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-red-400">Error</h3>
              <p className="mb-6 text-gray-300">{showStripeErrorModal}</p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowStripeErrorModal(null)}
                  className={`${buttonClass} bg-gray-700 hover:bg-gray-600 text-white`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showBillingPortalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
                <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-green-400">Redirecting...</h3>
                    <p className="mb-6 text-gray-300">
                        You would be redirected to the Stripe billing page now.
                    </p>
                    <div className="flex justify-center">
                        <button
                          onClick={() => {
                              // Simulate a successful upgrade on the client-side for demonstration
                              setStripeData(prev => ({ ...prev, status: 'active' }));
                              setShowBillingPortalModal(false);
                          }}
                          className={`${buttonClass} bg-green-600 hover:bg-green-700 text-black`}
                        >
                          Simulate Redirect
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showRenameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Rename Project</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full p-2 mb-6 rounded-md bg-gray-900 text-white border border-gray-700"
                placeholder="Enter new project name"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => renameProject(showRenameModal, newProjectName)}
                  className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowRenameModal(null);
                    setNewProjectName('');
                  }}
                  className={`${buttonClass} bg-gray-700 hover:bg-gray-600 text-white`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
