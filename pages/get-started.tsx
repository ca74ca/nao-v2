import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from "next/router";

interface Project {
  _id: string;
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

const App = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

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

  const fetchDashboardData = async () => {
    if (status !== 'authenticated' || !userEmail) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      addLog('Fetching projects...');
      const projectsResponse = await fetch('/api/getProjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createCheckoutSession', email: userEmail }),
        credentials: 'include',
      });
      if (!projectsResponse.ok) throw new Error(`HTTP error! status: ${projectsResponse.status}`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects.map((p: any) => ({ ...p, showKey: false })) || []);
      addLog(`✅ Found ${projectsData.projects?.length || 0} projects.`);

      addLog('Fetching subscription status...');
      const stripeStatusResponse = await fetch('/api/stripeStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'createCheckoutSession',
          email: userEmail || session?.user?.email || localStorage.getItem("userEmail"),
        }),
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
        body: JSON.stringify({ action: 'createCheckoutSession', email: userEmail }),
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

  const handleUpgradeToPro = async () => {
    addLog('Attempting to upgrade to Pro...');
    const userEmail = session?.user?.email || localStorage.getItem("userEmail");
    if (!userEmail) {
      setShowStripeErrorModal('Missing email. Please log in again.');
      addLog('❌ Missing user email. Cannot start upgrade flow.');
      return;
    }
    try {
      const response = await fetch('/api/stripeStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'createCheckoutSession',
          email: userEmail,
        }),
      });
      const { url } = await response.json();
      if (response.ok && url) {
        addLog('✅ Checkout session created. Redirecting to Stripe...');
        window.location.href = url;
      } else {
        setShowStripeErrorModal('Failed to start upgrade. Please try again.');
        addLog('❌ Failed to start Stripe checkout session.');
      }
    } catch (error) {
      console.error("Error starting Stripe checkout:", error);
      setShowStripeErrorModal('An error occurred. Please check your network connection.');
      addLog('❌ Checkout session failed due to an error.');
    }
  };

  // Router push for docs page
  const goToDocs = () => {
    router.push("/docs");
  };

  useEffect(() => {
    if (status === 'authenticated' && userEmail) {
      fetchDashboardData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, userEmail]);

  useEffect(() => {
    if (isProUser) {
      setUsageData({ count: projects.length, plan: 'Pro', limit: 100 });
    } else {
      setUsageData({ count: projects.length, plan: 'Free', limit: 3 });
    }
  }, [projects, isProUser]);

  const [usageStats, setUsageStats] = useState<UsageData[] | null>([]);

  useEffect(() => {
    const fetchUsageStats = async () => {
      const resolvedEmail =
        userEmail ||
        (session?.user?.email ?? null) ||
        localStorage.getItem("userEmail");
      if (!resolvedEmail) {
        console.warn("❌ Cannot proceed: no valid email available.");
        return;
      }
      try {
        const response = await fetch('/api/usageStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'createCheckoutSession',
            email: resolvedEmail,
          }),
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
    if (status === "authenticated") {
      fetchUsageStats();
    }
  }, [status, userEmail, session]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-6 py-10">
      <div className="w-full max-w-3xl">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
         
          {session?.user?.email && (
            <div className="flex items-center justify-between w-full mt-2">
              <div>
                <p className="text-sm text-gray-600">Welcome, {session.user.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>
        {/* Docs Button */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={goToDocs}
            className="px-4 py-2 bg-blue-700 rounded text-white font-medium hover:bg-blue-800 transition"
          >
            📄 View API Docs
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-500" />
            <p className="mt-4 text-xl text-gray-300">Loading your real data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
                      <div key={project._id} className="api-key-box">
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                            {project.projectName}
                          </h3>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            background: '#000',
                            color: '#39FF14',
                            padding: '6px',
                            borderRadius: '4px',
                            marginBottom: '10px',
                          }}>
                            {project.showKey ? project.apiKey : 'sk_live_*************************************'}
                          </div>
                        </div>
                        <div className="api-key-box">
                          <button onClick={() => setProjects(projects.map(p => p._id === project._id ? { ...p, showKey: !p.showKey } : p))}>
                            {project.showKey ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={() => copyToClipboard(project.apiKey)}>Copy</button>
                          <button onClick={() => setShowRegenModal(project._id)}>Regen</button>
                          <button onClick={() => setShowRenameModal(project._id)}>Rename</button>
                          <button onClick={() => setShowDeleteModal(project._id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 italic">No projects found. Create one to get started!</p>
                )}
              </section>
              <section className="section">
                <h2>Usage Analytics</h2>
                <div
                  style={{
                    backgroundColor: '#111',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    padding: '16px',
                    marginTop: '10px',
                    minHeight: '180px',
                  }}
                >
                  <p style={{ color: '#39FF14', fontSize: '16px', marginBottom: '8px' }}>
                    Total API Calls: {usageStats?.reduce((sum, d) => sum + d.calls, 0) || 0}
                  </p>
                  <p style={{ fontSize: '14px', color: '#999', lineHeight: '1.6' }}>
                    {usageStats && usageStats.length > 0 ? (
                      <>
                        Your API usage is currently at <strong>{projects.length}</strong> projects.
                        <br />
                        Upgrade to <span style={{ color: '#39FF14', fontWeight: '500' }}>Pro Plan</span> for more features and higher limits.
                      </>
                    ) : (
                      'No usage data available yet. Start by creating a project and making some API calls!'
                    )}
                  </p>
                </div>
              </section>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <section className="section">
                <h2>💳 Your Plan</h2>
                <div>
                  <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                    Plan: <strong>{usageData.plan}</strong>
                  </p>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                    Projects used: {projects.length}/{usageData.limit}
                  </p>
                  <button
                    className="button"
                    onClick={handleUpgradeToPro}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </section>
              <section className="section">
                <h2>🛠 Event Log</h2>
                <div className="log-box">
                  {errorLogs.map((log, index) => (
                    <div key={index} style={{ color: log.includes('❌') ? '#ff1a1a' : '#39FF14' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
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
        <footer style={{
          marginTop: '40px',
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #333',
          fontSize: '14px'
        }}>
          <button
            onClick={goToDocs}
            style={{
              color: '#39FF14',
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1px solid #39FF14',
              borderRadius: '6px',
              display: 'inline-block',
              fontWeight: 500,
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            📄 View API Docs
          </button>
        </footer>
      </div>
    </main>
  );
};

export default App;