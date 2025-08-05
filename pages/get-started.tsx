import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Package,
  Key,
  Trash2,
  Settings,
  Pencil,
  Copy,
  Plus,
  Loader2,
  X,
  RefreshCcw,
  CreditCard,
  Zap,
  LayoutDashboard
} from 'lucide-react';
// This is the real import you need for your Next.js app.
// The error you saw was because this environment doesn't have the 'next-auth/react' package.
import { useSession } from 'next-auth/react';
import connectToDatabase from "@/lib/mongodb"; // ✅ correct!

// --- Type Definitions for enhanced TypeScript support ---
interface Project {
  _id: string; // Using '_id' to match MongoDB's default ID field
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
  status: string; // 'free' or 'active'
  current_period_end: string;
}

// --- Main Application Component ---
const App = () => {
  // Use the session from next-auth/react
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  // State variables for the application's UI and data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegenModal, setShowRegenModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [usageData, setUsageData] = useState({ count: 0, plan: 'Free', limit: 3 });
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [stripeData, setStripeData] = useState<UserStripeData>({
    userId: '',
    stripeCustomerId: '',
    subscriptionId: '',
    status: 'free',
    current_period_end: ''
  });
  const [showStripeErrorModal, setShowStripeErrorModal] = useState<string | null>(null);

  const isProUser = stripeData.status === 'active';
  const isUsageLimitReached = projects.length >= usageData.limit;

  // --- Utility Functions ---
  const addLog = (message: string) => {
    setErrorLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const copyToClipboard = (key: string) => {
    if (key) {
      const tempInput = document.createElement('input');
      tempInput.value = key;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        addLog('🔐 API key copied to clipboard!');
      } catch (err) {
        addLog('❌ Failed to copy API key.');
        console.error('Copy to clipboard failed:', err);
      }
      document.body.removeChild(tempInput);
    }
  };

  // --- API Functions (Connect to your real backend here) ---
  const fetchDashboardData = async () => {
    if (status !== 'authenticated' || !userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch projects from your MongoDB backend
      addLog('Fetching projects...');
      const projectsResponse = await fetch('/api/getProjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!projectsResponse.ok) throw new Error(`HTTP error! status: ${projectsResponse.status}`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects.map((p: any) => ({ ...p, showKey: false })) || []);
      addLog(`✅ Found ${projectsData.projects?.length || 0} projects.`);

      // 2. Fetch stripe status from your backend
      addLog('Fetching subscription status...');
      const stripeStatusResponse = await fetch('/api/stripeStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
        credentials: 'include', // ✅ THIS IS THE FIX
      });
      if (!stripeStatusResponse.ok) throw new Error(`HTTP error! status: ${stripeStatusResponse.status}`);
      const stripeStatusData = await stripeStatusResponse.json();
      setStripeData(stripeStatusData);
      addLog(`✅ Subscription status is: ${stripeStatusData.status}`);

    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      addLog(`❌ Failed to load data from backend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!userEmail) return;
    try {
      addLog('Attempting to create new project...');
      const response = await fetch('/api/createProject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      addLog('✅ New project created.');
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error creating project:", error);
      addLog(`❌ Failed to create project: ${error.message}`);
    }
  };

  const regenerateKey = async (projectId: string) => {
    if (!userEmail) return;
    try {
      addLog(`Attempting to regenerate key for project ID: ${projectId}`);
      const response = await fetch('/api/updateProject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, newKey: true }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      addLog(`✅ API key regenerated for project ID: ${projectId}`);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error regenerating key:", error);
      addLog(`❌ Failed to regenerate key: ${error.message}`);
    }
    setShowRegenModal(null);
  };

  const deleteProjectAndKey = async (projectId: string) => {
    if (!userEmail) return;
    try {
      addLog(`Attempting to delete project ID: ${projectId}`);
      const response = await fetch('/api/deleteProject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      addLog('✅ Project deleted successfully.');
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      addLog(`❌ Failed to delete project: ${error.message}`);
    }
    setShowDeleteModal(null);
  };

  const renameProject = async (projectId: string, newName: string) => {
    if (!newName || !userEmail) return;
    try {
      addLog(`Attempting to rename project ID: ${projectId} to '${newName}'`);
      const response = await fetch('/api/updateProject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, newName }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      addLog(`✅ Project renamed to '${newName}' successfully.`);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error renaming project:", error);
      addLog(`❌ Failed to rename project: ${error.message}`);
    }
    setShowRenameModal(null);
    setNewProjectName('');
  };

  // --- Stripe Logic (Real API Calls) ---
  const handleManageBilling = async () => {
  addLog('Attempting to create Stripe billing portal session...');

  const userEmail = session?.user?.email || localStorage.getItem("userEmail");
  if (!userEmail) {
    setShowStripeErrorModal('Missing email. Please log in again.');
    addLog('❌ Missing user email. Cannot open billing portal.');
    return;
  }

  try {
    const response = await fetch('/api/stripeStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'createBillingPortalSession',
        email: userEmail,
      }),
    });

    const { url } = await response.json();

    if (response.ok && url) {
      addLog('✅ Stripe billing portal created, redirecting...');
      window.location.href = url;
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
  // --- Effects ---
  // Initial data fetch when session becomes available
  useEffect(() => {
    if (status === 'authenticated' && userEmail) {
      fetchDashboardData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, userEmail]);

  // Update usage data when projects or plan status changes
  useEffect(() => {
    if (isProUser) {
      setUsageData({ count: projects.length, plan: 'Pro', limit: 100 });
    } else {
      setUsageData({ count: projects.length, plan: 'Free', limit: 3 });
    }
  }, [projects, isProUser]);

  const progressWidth = `${(projects.length / usageData.limit) * 100}%`;

  // Memoized usage stats state (with null for error fallback)
  const [usageStats, setUsageStats] = useState<UsageData[] | null>([]);

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        if (!userEmail) return;

        const response = await fetch('/api/usageStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
          credentials: 'include',
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setUsageStats(data);
      } catch (err) {
        console.error("Failed to fetch usage stats:", err);
        addLog("❌ Failed to load usage stats.");
        setUsageStats(null);
      }
    };

    if (status === "authenticated" && userEmail) {
      fetchUsageStats();
    }
  }, [status, userEmail]);

  if (usageStats === null) {
    return (
      <div className="text-red-500 bg-red-100 p-4 rounded">
        ⚠️ Error loading usage stats. Please try again later.
      </div>
    );
  }

  function handleUpgrade(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    addLog('Redirecting to Stripe checkout...');
    // Call your backend to create a Stripe Checkout session
    fetch('/api/stripeStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'createCheckoutSession',
        email: userEmail,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          setShowStripeErrorModal('Failed to create Stripe checkout session. Please try again.');
          addLog('❌ Failed to create Stripe checkout session.');
        }
      })
      .catch((error) => {
        setShowStripeErrorModal('An error occurred. Please check your network connection.');
        addLog('❌ Stripe checkout session creation failed due to an error.');
        console.error(error);
      });
  }
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 tracking-tight leading-none mb-2 sm:mb-0">
            EffortNet Dashboard
          </h1>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-500" />
            <p className="mt-4 text-xl text-gray-300">Loading your real data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">

              {/* API Projects Section */}
              <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-200 flex items-center">
                    <Package className="mr-3 h-6 w-6 text-blue-400" />
                    API Projects
                  </h2>
                  <button
                    onClick={() => createProject()}
                    disabled={isUsageLimitReached}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors duration-300
                      ${isUsageLimitReached
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                      }`}
                  >
                    <Plus className="h-5 w-5" />
                    <span>New Project</span>
                  </button>
                </div>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div key={project._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white truncate">{project.projectName}</h3>
                          <div className="flex items-center mt-1 text-sm text-gray-400">
                            <Key className="h-4 w-4 mr-2 text-indigo-400" />
                            <span className="font-mono text-xs select-text">
                              {project.showKey ? project.apiKey : 'sk_live_*************************************'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 md:space-x-2">
                          <button
                            onClick={() => setProjects(
                              projects.map(p =>
                                p._id === project._id ? { ...p, showKey: !p.showKey } : p
                              )
                            )}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-900 rounded-full hover:bg-indigo-800 transition-colors"
                          >
                            {project.showKey ? 'Hide' : 'Show'} Key
                          </button>
                          <button
                            onClick={() => copyToClipboard(project.apiKey)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-900 rounded-full hover:bg-emerald-800 transition-colors"
                          >
                            <Copy className="inline-block h-3 w-3 mr-1" />
                            Copy
                          </button>
                          <button
                            onClick={() => setShowRegenModal(project._id)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-yellow-300 bg-yellow-900 rounded-full hover:bg-yellow-800 transition-colors"
                          >
                            <RefreshCcw className="inline-block h-3 w-3 mr-1" />
                            Regen
                          </button>
                          <button
                            onClick={() => setShowRenameModal(project._id)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-900 rounded-full hover:bg-blue-800 transition-colors"
                          >
                            <Pencil className="inline-block h-3 w-3 mr-1" />
                            Rename
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(project._id)}
                            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-900 rounded-full hover:bg-red-800 transition-colors"
                          >
                            <Trash2 className="inline-block h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 italic">No projects found. Create one to get started!</p>
                )}
              </section>

              {/* Usage Analytics Section */}
              <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-6">
                  <LayoutDashboard className="mr-3 h-6 w-6 text-blue-400" />
                  Usage Analytics
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={usageStats} // This uses the real usage data from your API.
                      margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#9ca3af' }}
                      />
                      <Line type="monotone" dataKey="calls" stroke="#8b5cf6" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>

            {/* Sidebar / Plan & Logs */}
            <div className="lg:col-span-1 space-y-6">

              {/* Plan & Billing Section */}
              <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-6">
                  <CreditCard className="mr-3 h-6 w-6 text-blue-400" />
                  Your Plan
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Zap className={`h-5 w-5 mr-2 ${isProUser ? 'text-yellow-400' : 'text-indigo-400'}`} />
                      {usageData.plan} Plan
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm">
                      You have used {projects.length} of {usageData.limit} projects.
                    </p>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500
                        ${isUsageLimitReached ? 'bg-red-500' : 'bg-indigo-600'}`}
                      style={{ width: progressWidth }}
                    ></div>
                  </div>
                  {!isProUser ? (
                    <button
                      onClick={handleUpgrade}
                      className="w-full flex items-center justify-center px-4 py-2 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  ) : (
                    <button
                      onClick={handleManageBilling}
                      className="w-full flex items-center justify-center px-4 py-2 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Manage Billing
                    </button>
                  )}
                </div>
              </section>

              {/* Event Log Section */}
              <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-200 flex items-center mb-4">
                  <Settings className="mr-3 h-6 w-6 text-blue-400" />
                  Event Log
                </h2>
                <div className="bg-gray-800 rounded-lg p-4 text-sm font-mono text-gray-400 h-40 overflow-y-auto">
                  {errorLogs.map((log, index) => (
                    <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* --- Modals --- */}
        {/* Modal for Regenerate Key */}
        {showRegenModal && (
          <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Regenerate API Key</h3>
                <button onClick={() => setShowRegenModal(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-400">
                Are you sure you want to regenerate the API key for this project? This cannot be undone and will immediately invalidate the old key.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRegenModal(null)}
                  className="px-4 py-2 rounded-full font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => regenerateKey(showRegenModal)}
                  className="px-4 py-2 rounded-full font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Delete Project */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Delete Project</h3>
                <button onClick={() => setShowDeleteModal(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this project? This will permanently remove all data and keys associated with it. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 rounded-full font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProjectAndKey(showDeleteModal)}
                  className="px-4 py-2 rounded-full font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Rename Project */}
        {showRenameModal && (
          <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Rename Project</h3>
                <button onClick={() => setShowRenameModal(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter new project name"
                className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRenameModal(null);
                    setNewProjectName('');
                  }}
                  className="px-4 py-2 rounded-full font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => renameProject(showRenameModal, newProjectName)}
                  disabled={!newProjectName}
                  className="px-4 py-2 rounded-full font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-500 transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Stripe Error */}
        {showStripeErrorModal && (
          <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-red-500">Stripe Error</h3>
                <button onClick={() => setShowStripeErrorModal(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-400">
                {showStripeErrorModal}
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowStripeErrorModal(null)}
                  className="px-4 py-2 rounded-full font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  OK
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
