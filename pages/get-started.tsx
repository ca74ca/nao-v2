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
const firebaseConfig =
  typeof window !== 'undefined' && (window as any).__firebase_config
    ? JSON.parse((window as any).__firebase_config)
    : {};

const __initial_auth_token =
  typeof window !== 'undefined' && (window as any).__initial_auth_token
    ? (window as any).__initial_auth_token
    : undefined;
const __app_id = typeof window !== 'undefined' && (window as any).__app_id
  ? (window as any).__app_id
  : 'default-app-id';

// --- Main Application Component ---
const App = () => {
  // State variables for the application's UI and data
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegenModal, setShowRegenModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [showConfigureModal, setShowConfigureModal] = useState<string | null>(null);
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
// Removed duplicate createProject function to resolve redeclaration error.
useEffect(() => {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const firestore = getFirestore(app);

    signInAnonymously(authInstance)
      .then((userCredential) => {
        const user = userCredential.user;
        setUserId(user.uid);
        setDb(firestore);
        setAuth(authInstance);
        setAuthStatus("Authenticated ✅");
      })
      .catch((error) => {
        console.error("Firebase Auth Error:", error);
        setAuthStatus("Auth Failed ❌");
      });
  }
}, []);



  // Memoized mock data for the usage graph
  const mockUsageGraphData: UsageData[] = useMemo(() => {
    return [
      { name: 'Mon', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Tue', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Wed', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Thu', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Fri', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Sat', calls: Math.floor(Math.random() * 500) + 100 },
      { name: 'Sun', calls: Math.floor(Math.random() * 500) + 100 },
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
      // Create a temporary input element to copy the text from
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

  // --- Stripe Logic ---
  const handleUpgrade = async () => {
    addLog('Attempting to create Stripe checkout session...');
    try {
      const res = await new Promise(resolve => setTimeout(() => {
        resolve({
          json: () => Promise.resolve({ url: 'https://checkout.stripe.com/mock-session-id' })
        });
      }, 1500));

      const { url } = await (res as any).json();

      if (url) {
        addLog('✅ Stripe session created, redirecting...');
        setShowBillingPortalModal(true);
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
    try {
        const res = await new Promise(resolve => setTimeout(() => {
            resolve({
                json: () => Promise.resolve({ url: 'https://billing.stripe.com/mock-portal' })
            });
        }, 1500));
        
        const { url } = await (res as any).json();
        if (url) {
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
  const createProject = async (projectName: string = "Untitled Project") => {
    if (!db || !userId) return;

const newId = doc(collection(db, `artifacts/${__app_id}/users/${userId}/projects`)).id;

    const newProject: Project = {
      id: newId,
      projectName,
      apiKey: `sk_live_${Math.random().toString(36).slice(2, 16).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      showKey: false
    };

const projectRef = doc(db, `artifacts/${__app_id}/users/${userId}/projects`, newId);
await setDoc(projectRef, newProject);
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

  const deleteProjectAndKey = async (projectId: string) => {
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
  // Sets an error message in the event log and updates loading state
  const setError = (message: string) => {
    setErrorLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ❌ ${message}`]);
    setLoading(false);
  };

  useEffect(() => {
  const initFirebase = async () => {
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

      onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          setUser({ id: user.uid, email: 'user@example.com' });
          setAuthStatus('✅ Authenticated');
        } else {
          setUserId('N/A');
          setAuthStatus('❌ Not Authenticated');
        }
        setLoading(false);
      });
    } catch (err) {
      console.error('🔥 Firebase init error:', err);
      setError('Firebase setup failed.');
      setLoading(false);
    }
  };

  initFirebase();
}, []);
  useEffect(() => {
    if (!db || !userId) return;

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

  const progressWidth = `${(projects.length / usageData.limit) * 100}%`;
  const isUsageLimitReached = projects.length >= usageData.limit;

  return (
    <>
      <style>
        {`
          /* Custom CSS for the EVE Developer Dashboard to replace Tailwind */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
          
          body, html, #root {
              height: 100%;
              margin: 0;
          }

          .app-container {
              min-height: 100vh;
              background-color: #000;
              color: #fff;
              padding: 3rem 1.5rem;
              font-family: 'Inter', monospace;
              
          }

          .main-content {
              max-width: 80rem; /* 1280px */
              margin-left: auto;
              margin-right: auto;
              display: flex;
              flex-direction: column;
              gap: 3rem;
          }
          
          .section-title-container {
              margin-bottom: 3rem;
          }

          .main-title {
              font-size: 2.25rem;
              font-weight: 800;
              color: #4ade80; /* green-400 */
              letter-spacing: -0.025em; /* tracking-tight */
          }
          
          .main-subtitle {
              color: #9ca3af; /* gray-400 */
              margin-top: 0.5rem;
          }

          .card {
              background-color: #0d0d0d;
              padding: 1.5rem;
              border-radius: 0.75rem;
              border: 1px solid #1f2937; /* gray-800 */
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          }
          
          .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
          }

          .auth-info p {
              margin: 0;
          }

          .auth-status-label {
              color: #9ca3af; /* gray-400 */
          }

          .auth-user-id {
              font-size: 0.875rem; /* text-sm */
              color: #facc15; /* yellow-400 */
          }

          .refresh-button {
              background-color: #374151; /* gray-700 */
              color: #fff;
              padding: 0.25rem 0.75rem;
              border-radius: 0.25rem;
              transition-property: background-color;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              transition-duration: 150ms;
              font-size: 0.875rem; /* text-sm */
          }

          .refresh-button:hover {
              background-color: #4b5563; /* gray-600 */
          }

          .loading-container {
              text-align: center;
              padding-top: 5rem;
              padding-bottom: 5rem;
          }

          .spinner {
              animation: spin 1s linear infinite;
              border-radius: 9999px; /* rounded-full */
              height: 4rem;
              width: 4rem;
              border-top: 2px solid #4ade80; /* green-400 */
              border-bottom: 2px solid #4ade80; /* green-400 */
              margin-left: auto;
              margin-right: auto;
          }

          @keyframes spin {
              from {
                  transform: rotate(0deg);
              }
              to {
                  transform: rotate(360deg);
              }
          }

          .loading-text {
              margin-top: 1rem;
              font-size: 1.125rem;
              color: #9ca3af; /* gray-400 */
          }

          .dashboard-sections {
              display: flex;
              flex-direction: column;
              gap: 3rem;
          }
          
          .section-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #60a5fa; /* blue-400 */
          }

          .plan-info {
              color: #9ca3af; /* gray-400 */
          }

          .upgrade-button, .manage-billing-button, .action-button, .create-project-button, .modal-button {
              flex: 1;
              padding: 0.25rem 0.75rem;
              padding-left: 0.75rem;
              padding-right: 0.75rem;
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
              border-radius: 0.25rem;
              transition: transform 0.2s ease-in-out;
              transform: scale(1);
              cursor: pointer;
              border: none;
              text-align: center;
          }

          .upgrade-button {
              background-color: #16a34a; /* green-600 */
              color: #000;
          }

          .upgrade-button:hover {
              background-color: #15803d; /* green-700 */
              transform: scale(1.05);
          }
          
          .manage-billing-button {
              background-color: #ca8a04; /* yellow-600 */
              color: #000;
          }

          .manage-billing-button:hover {
              background-color: #a16207; /* yellow-700 */
              transform: scale(1.05);
          }

          .usage-progress-bar {
              margin-top: 1rem;
              width: 100%;
              background-color: #374151; /* gray-700 */
              border-radius: 9999px; /* rounded-full */
              height: 0.625rem;
          }

          .progress-bar-fill {
              background-color: #2563eb; /* blue-600 */
              height: 0.625rem;
              border-radius: 9999px;
              transition-property: width;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              transition-duration: 500ms;
          }

          .usage-text {
              font-size: 0.875rem;
              margin-top: 0.5rem;
              color: #6b7280; /* gray-500 */
          }
          
          .graph-container {
              margin-top: 2rem;
              height: 16rem;
              width: 100%;
          }

          .graph-label {
              text-align: center;
              color: #6b7280; /* gray-500 */
              font-size: 0.875rem;
              margin-top: 0.5rem;
          }

          .project-card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 1rem;
          }

          .project-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #60a5fa; /* blue-400 */
          }

          .project-actions {
              display: flex;
              gap: 0.5rem;
          }

          .rename-button, .configure-button, .delete-button {
              transition-property: color;
              transition-duration: 150ms;
          }

          .rename-button {
              color: #3b82f6; /* blue-500 */
          }

          .rename-button:hover {
              color: #60a5fa; /* blue-400 */
          }

          .configure-button {
              color: #eab308; /* yellow-500 */
          }
          
          .configure-button:hover {
              color: #fcd34d; /* yellow-400 */
          }

          .delete-button {
              color: #ef4444; /* red-500 */
          }

          .delete-button:hover {
              color: #f87171; /* red-400 */
          }

          .project-description {
              font-size: 0.875rem;
              color: #6b7280; /* gray-500 */
              margin-bottom: 1rem;
          }

          .api-key-container {
              margin-top: 1.5rem;
          }

          .api-key-label {
              font-size: 1.125rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              color: #d1d5db; /* gray-300 */
          }

          .api-key-display {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
          }

          .api-key-text {
              width: 100%;
              flex: 1;
              background-color: #111827; /* gray-900 */
              padding: 1rem;
              border-radius: 0.5rem;
              font-family: monospace;
              word-break: break-all;
              color: #f9fafb; /* gray-100 */
              border: 1px solid #374151; /* gray-700 */
          }

          .key-actions {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              width: 100%;
          }

          .copy-button {
              background-color: #16a34a; /* green-600 */
              color: #000;
          }

          .copy-button:hover {
              background-color: #15803d; /* green-700 */
          }

          .show-hide-button {
              background-color: #ca8a04; /* yellow-600 */
              color: #000;
          }
          
          .show-hide-button:hover {
              background-color: #a16207; /* yellow-700 */
          }

          .regenerate-button {
              background-color: #dc2626; /* red-600 */
              color: #fff;
          }

          .regenerate-button:hover {
              background-color: #b91c1c; /* red-700 */
          }

          .create-project-container {
              display: flex;
              justify-content: center;
          }

          .create-project-button {
              color: #fff;
              background-color: #2563eb; /* blue-600 */
              max-width: 16rem;
          }

          .create-project-button:hover {
              background-color: #1d4ed8; /* blue-700 */
          }

          .create-project-button.disabled {
              background-color: #374151; /* gray-700 */
              cursor: not-allowed;
          }
          
          .quickstart-container {
              border-bottom: 1px solid #374151; /* gray-700 */
              margin-bottom: 1rem;
              display: flex;
          }

          .quickstart-tab {
              padding: 0.5rem 1rem;
              font-size: 0.875rem;
              font-weight: 600;
              transition-property: color;
              transition-duration: 150ms;
              color: #9ca3af; /* gray-400 */
              cursor: pointer;
          }
          
          .quickstart-tab.active {
              color: #60a5fa; /* blue-400 */
              border-bottom: 2px solid #60a5fa; /* blue-400 */
          }

          .code-block {
              background-color: #000;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              color: #4ade80; /* green-400 */
              border: 1px solid #374151; /* gray-700 */
              font-family: monospace;
              font-size: 0.875rem;
          }
          
          .next-steps-actions {
              display: flex;
              flex-direction: column;
              gap: 1rem;
          }

          .docs-button {
              background-color: #2563eb; /* blue-600 */
              color: #fff;
          }

          .docs-button:hover {
              background-color: #1d4ed8; /* blue-700 */
          }

          .sdk-button {
              background-color: #4b5563; /* gray-600 */
              color: #fff;
          }

          .sdk-button:hover {
              background-color: #374151; /* gray-700 */
          }

          .event-log-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #d1d5db; /* gray-300 */
              margin-bottom: 1rem;
          }
          
          .event-log-box {
              height: 10rem;
              background-color: #111827; /* gray-900 */
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-y: auto;
              color: #9ca3af; /* gray-400 */
              font-size: 0.75rem;
              font-family: monospace;
              border: 1px solid #374151; /* gray-700 */
          }

          .modal-overlay {
              position: fixed;
              inset: 0;
              background-color: rgba(0, 0, 0, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
          }

          .modal-content {
              background-color: #1e1e1e;
              padding: 2rem;
              border-radius: 1rem;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
              width: 100%;
              max-width: 24rem; /* 384px */
              text-align: center;
              border: 2px solid #374151; /* gray-700 */
          }

          .modal-title {
              font-size: 1.25rem;
              font-weight: 700;
              margin-bottom: 1rem;
          }
          
          .modal-message {
              margin-bottom: 1.5rem;
              color: #d1d5db; /* gray-300 */
          }

          .modal-actions {
              display: flex;
              gap: 1rem;
          }

          .modal-input {
              width: 100%;
              padding: 0.5rem;
              margin-bottom: 1.5rem;
              border-radius: 0.375rem;
              background-color: #111827; /* gray-900 */
              color: #fff;
              border: 1px solid #374151; /* gray-700 */
          }

          .modal-button-rename {
              background-color: #2563eb; /* blue-600 */
              color: #fff;
          }

          .modal-button-rename:hover {
              background-color: #1d4ed8; /* blue-700 */
          }

          .modal-button-cancel {
              background-color: #4b5563; /* gray-700 */
              color: #fff;
          }

          .modal-button-cancel:hover {
              background-color: #374151; /* gray-600 */
          }

          .modal-button-delete {
              background-color: #dc2626; /* red-600 */
              color: #fff;
          }

          .modal-button-delete:hover {
              background-color: #b91c1c; /* red-700 */
          }

          .modal-button-dismiss {
              background-color: #4b5563; /* gray-700 */
              color: #fff;
          }
          
          .modal-button-dismiss:hover {
              background-color: #374151; /* gray-600 */
          }

          .modal-button-redirect {
              background-color: #16a34a; /* green-600 */
              color: #000;
          }

          .modal-button-redirect:hover {
              background-color: #15803d; /* green-700 */
          }

          .modal-button-close {
              background-color: #4b5563;
              color: #fff;
              max-width: 150px;
          }
          
          .modal-button-close:hover {
              background-color: #374151;
          }

          /* Responsive Styles */
          @media (min-width: 640px) {
              .main-title {
                  font-size: 3rem; /* md:text-5xl */
              }

              .card-header, .api-key-display, .key-actions, .next-steps-actions {
                  flex-direction: row;
              }
              
              .next-steps-actions > a {
                  flex: 1;
              }

              .key-actions {
                  width: auto;
              }

              .api-key-text {
                  max-width: 100%;
              }

              .upgrade-button, .manage-billing-button {
                  margin-top: 0;
              }
          }
        `}
      </style>

      <div className="app-container">
        <div className="main-content">
          {/* Title */}
          <div>
            <h1 className="main-title">
              EVE Developer Dashboard
            </h1>
            <p className="main-subtitle">
              Your live project, API key, and QuickStart tools are ready.
            </p>
          </div>

          {/* Auth Info */}
          <div className="card">
            <div className="card-header">
              <div className="auth-info">
                <p><span className="auth-status-label">Status:</span> <strong>{authStatus}</strong></p>
                <p><span className="auth-status-label">User ID:</span> <span className="auth-user-id">{userId}</span></p>
              </div>
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="refresh-button"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Setting up your dashboard...</p>
            </div>
          ) : (
            <div className="dashboard-sections">
              {/* Usage & Billing Section */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="section-title">Usage & Billing</h2>
                    <p className="plan-info">Current Plan: <strong>{usageData.plan}</strong> - You can create up to {usageData.limit} projects.</p>
                  </div>
                  {!isProUser ? (
                    <button
                      onClick={handleUpgrade}
                      className="upgrade-button"
                    >
                      Upgrade to Pro
                    </button>
                  ) : (
                      <button
                          onClick={handleManageBilling}
                          className="manage-billing-button"
                      >
                          Manage Billing
                      </button>
                  )}
                </div>
                <div className="usage-progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: progressWidth }}
                  ></div>
                </div>
                <p className="usage-text">
                  {projects.length} of {usageData.limit} projects used.
                </p>

                {/* Usage Graph */}
                <div className="graph-container">
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
                <p className="graph-label">Daily API Call Volume (Mock Data)</p>
              </div>

              {/* Project Section */}
              {projects.map((project) => (
                <div key={project.id} className="card">
                  <div className="project-card-header">
                    <h2 className="project-title">{project.projectName}</h2>
                    <div className="project-actions">
                      <button
                        onClick={() => {
                          setNewProjectName(project.projectName);
                          setShowRenameModal(project.id);
                        }}
                        className="rename-button"
                      >
                        Rename
                      </button>
                      <button
                          onClick={() => setShowConfigureModal(project.id)}
                          className="configure-button"
                      >
                          Configure
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(project.id)}
                        className="delete-button"
                      >
                        Delete Project
                      </button>
                    </div>
                  </div>
                  <p className="project-description">
                    This project was auto-generated to get you started with EVE Fraud Detection.
                  </p>

                  {/* API Key Section */}
                  <div className="api-key-section">
                    <p className="text-sm text-gray-400 mt-2">
                      API Key:{" "}
                      {project.showKey ? (
                        <span className="font-mono text-green-400">{project.apiKey}</span>
                      ) : (
                        <span className="font-mono text-yellow-500">••••••••••••••••</span>
                      )}
                    </p>
                    <button
                      onClick={async () => {
                        const updated = projects.map(p => p.id === project.id ? { ...p, showKey: !p.showKey } : p);
                        setProjects(updated);
                      }}
                      className="text-blue-400 underline text-xs mt-1"
                    >
                      {project.showKey ? "Hide Key" : "Show Key"}
                    </button>
                    {project.showKey && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(project.apiKey);
                        }}
                        className="text-xs text-gray-400 ml-4 hover:text-gray-200"
                        style={{ marginLeft: '1rem' }}
                      >
                        Copy Key
                      </button>
                    )}
                  </div>

                  <div className="quickstart-container">
                    <button
                      onClick={() => setSdkSnippetTab("javascript")}
                      className={`quickstart-tab ${sdkSnippetTab === "javascript" ? "active" : ""}`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setSdkSnippetTab("python")}
                      className={`quickstart-tab ${sdkSnippetTab === "python" ? "active" : ""}`}
                    >
                      Python
                    </button>
                  </div>

                  <button
  className="copy-snippet-btn"
  onClick={() =>
    navigator.clipboard.writeText(
      sdkSnippetTab === 'javascript'
        ? `fetch('https://naoverse.io/api/scoreEffort', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${projects[0].apiKey}'
  },
  body: JSON.stringify({
    url: 'https://www.tiktok.com/@creator/video/1234567890',
    sourceType: 'tiktok'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));`
        : `import requests

headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${projects[0].apiKey}'
}

payload = {
  "url": "https://www.tiktok.com/@creator/video/1234567890",
  "sourceType": "tiktok"
}

res = requests.post("https://naoverse.io/api/scoreEffort", headers=headers, json=payload)
print(res.json())`
    )
  }
>
  📋 Copy Snippet
</button>
                  <pre className="quickstart-codeblock">
                    <code>
                      {sdkSnippetTab === "javascript" ? (
                        <>
                          {`fetch('https://naoverse.io/api/scoreEffort', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${projects[0].apiKey}'
  },
  body: JSON.stringify({
    url: 'https://www.tiktok.com/@creator/video/1234567890',
    sourceType: 'tiktok'
  }),
})
  .then(res => res.json())
  .then(data => console.log(data));`}
                        </>
                      ) : (
                        <>
                          {`import requests

headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${projects[0].apiKey}'
}

payload = {
  "url": "https://www.tiktok.com/@creator/video/1234567890",
  "sourceType": "tiktok"
}

res = requests.post("https://naoverse.io/api/scoreEffort", headers=headers, json=payload)
print(res.json())`}
                        </>
                      )}
                    </code>
                  </pre>
                </div>
              ))}

              <div className="create-project-container">
                <button
                  onClick={() => createProject("New Project")}
                  className={`action-button create-project-button ${isUsageLimitReached ? 'disabled' : ''}`}
                  disabled={isUsageLimitReached}
                >
                  Create Another Project
                </button>
              </div>

              {/* QuickStart Examples (using the first project's key) */}
              {projects.length > 0 && (
                <div className="card">
                  <h2 className="section-title">QuickStart Examples</h2>
                  <p className="project-description">
                    Make your first API call with the key from your primary project.
                  </p>
                  <div className="quickstart-container">
                      <button
                          onClick={() => setSdkSnippetTab('javascript')}
                          className={`quickstart-tab ${sdkSnippetTab === 'javascript' ? 'active' : ''}`}
                      >
                          JavaScript
                      </button>
                      <button
                          onClick={() => setSdkSnippetTab('python')}
                          className={`quickstart-tab ${sdkSnippetTab === 'python' ? 'active' : ''}`}
                      >
                          Python
                      </button>
                      <button
                          onClick={() => setSdkSnippetTab('curl')}
                          className={`quickstart-tab ${sdkSnippetTab === 'curl' ? 'active' : ''}`}
                      >
                          cURL
                      </button>
                  </div>
                  {sdkSnippetTab === 'javascript' && (
                      <pre className="code-block">
                          <code>{`// 🚨 SECURITY WARNING: In a production environment, never hardcode your API key client-side.
// Use a secure backend to make API calls to prevent key exposure.
// The key should be stored securely on your server, not in a browser or mobile app.
const apiKey = "${projects[0].apiKey}";

const data = {
  url: "https://www.tiktok.com/viral-video",
  sourceType: "tiktok",
  wallet: "0x123...abc" // Optional wallet for web3-related fraud checks
};

fetch('https://api.naoverse.io/v1/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 🔐 This is a bearer token for authentication. Never expose it publicly.
    'Authorization': 'Bearer ' + projects[0].apiKey
  },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('API call failed:', err));
`}</code>
                        </pre>
                    )}
                  {sdkSnippetTab === 'curl' && (
                      <pre className="code-block">
                          <code>{`# 🚨 SECURITY WARNING: For production, use a variable for your API key.
# curl -X POST https://api.naoverse.io/v1/verify \\
# -H "Content-Type: application/json" \\
# -H "Authorization: Bearer <YOUR_API_KEY>" \\
# -d '{"url":"https://www.tiktok.com/viral-video", "sourceType": "tiktok"}'

curl -X POST https://api.naoverse.io/v1/verify \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${projects[0].apiKey}" \\
-d '{
  "url": "https://www.tiktok.com/viral-video",
  "sourceType": "tiktok",
  "wallet": "0x123...abc"
}'`}</code>
                      </pre>
                  )}
                </div>
              )}

              {/* SDK & Docs Section */}
              <div className="card">
                <h2 className="section-title">Next Steps</h2>
                <p className="project-description">
                  Dive deeper into our platform's capabilities with our documentation and SDKs.
                </p>
                <div className="next-steps-actions">
                  <a href="#" className="action-button docs-button">
                    View Full Docs
                  </a>
                  <a href="#" className="action-button sdk-button">
                    Explore SDKs
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Event Log Panel */}
          <div className="card">
            <h2 className="event-log-title">Event Log</h2>
            <div className="event-log-box">
              {errorLogs.length > 0 ? (
                errorLogs.map((log, index) => <div key={index}>{log}</div>)
              ) : (
                <div>No recent events.</div>
              )}
            </div>
          </div>

          {/* Modals */}
          {showRegenModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title" style={{ color: '#f87171' }}>Are you sure?</h3>
                <p className="modal-message">Regenerating this key will invalidate the old one for this project. This cannot be undone.</p>
                <div className="modal-actions">
                  <button
                    onClick={() => regenerateKey(showRegenModal)}
                    className="modal-button modal-button-delete"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => setShowRegenModal(null)}
                    className="modal-button modal-button-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title" style={{ color: '#f87171' }}>Are you sure you want to delete this project?</h3>
                <p className="modal-message">This will permanently delete the project and its key. This cannot be undone.</p>
                <div className="modal-actions">
                  <button
                    onClick={() => deleteProjectAndKey(showDeleteModal)}
                    className="modal-button modal-button-delete"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="modal-button modal-button-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showStripeErrorModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title" style={{ color: '#f87171' }}>Error</h3>
                <p className="modal-message">{showStripeErrorModal}</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowStripeErrorModal(null)}
                    className="modal-button modal-button-dismiss"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showBillingPortalModal && (
              <div className="modal-overlay">
                  <div className="modal-content">
                      <h3 className="modal-title" style={{ color: '#4ade80' }}>Redirecting...</h3>
                      <p className="modal-message">
                          You would be redirected to the Stripe billing page now.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                                setStripeData(prev => ({ ...prev, status: 'active' }));
                                setShowBillingPortalModal(false);
                            }}
                            className="modal-button modal-button-redirect"
                          >
                            Simulate Redirect
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {showRenameModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title" style={{ color: '#60a5fa' }}>Rename Project</h3>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="modal-input"
                  placeholder="Enter new project name"
                />
                <div className="modal-actions">
                  <button
                    onClick={() => renameProject(showRenameModal, newProjectName)}
                    className="modal-button modal-button-rename"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setShowRenameModal(null)}
                    className="modal-button modal-button-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showConfigureModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="modal-title" style={{ color: '#fcd34d' }}>Configure Project</h3>
                <p className="modal-message">
                  Project configuration settings would go here.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowConfigureModal(null)}
                    className="modal-button modal-button-close"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;

