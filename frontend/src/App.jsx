import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/shared/Navbar';
import WelcomeHero from './components/shared/WelcomeHero';
import OuterSidebar from './components/sidebar/OuterSidebar';
import InnerSidebar from './components/sidebar/InnerSidebar';
import ChatThread from './components/chat/ChatThread';
import ChatInput from './components/chat/ChatInput';
import PlanDisplay from './components/plan/PlanDisplay';
import DestinationCards from './components/plan/DestinationCards';
import useGeolocation from './hooks/useGeolocation';
import {
  sendMessage,
  selectDestination,
  switchDestination,
  clearSession,
} from './services/api';
import {
  getSessionId,
  saveSessionId,
  getTrips,
  saveTrip,
  clearSessionStorage,
} from './utils/localStorage';
import { willFetchDestinations, getCurrencyCode } from './utils/planHelpers';

function App() {
  const { city: geoCity, loading: geoLoading } = useGeolocation();

  const [sessionId, setSessionId] = useState(() => getSessionId() || uuidv4());
  const [messages, setMessages] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [collectedState, setCollectedState] = useState({});
  const [awaitingDestinationPick, setAwaitingDestinationPick] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [trips, setTrips] = useState(() => getTrips());

  const sourceLocation = geoCity ?? null;

  useEffect(() => {
    saveSessionId(sessionId);
  }, [sessionId]);

  const resetConversation = useCallback((newSession = true) => {
    if (newSession) {
      const id = uuidv4();
      setSessionId(id);
      saveSessionId(id);
    }
    setMessages([]);
    setCurrentPlan(null);
    setDestinations([]);
    setCollectedState({});
    setAwaitingDestinationPick(false);
    setConversationStarted(false);
    setIsLoading(false);
    setLoadingMode(null);
    setSwitching(false);
    setSidebarView('chat');
  }, []);

  const appendAssistant = useCallback((content, isFollowUp = false) => {
    setMessages((prev) => [
      ...prev,
      { id: uuidv4(), role: 'assistant', content, isFollowUp },
    ]);
  }, []);

  const handleApiResponse = useCallback(
    (data) => {
      switch (data.type) {
        case 'follow_up':
          setCollectedState(data.collected_so_far || {});
          appendAssistant(data.message, true);
          break;

        case 'destinations':
          setCollectedState(data.collected_state || {});
          setDestinations(data.destinations || []);
          setAwaitingDestinationPick(true);
          appendAssistant(data.message);
          toast.success('Destinations ready — pick one to continue');
          break;

        case 'plan': {
          const plan = data.plan;
          setCollectedState(data.collected_state || {});
          setCurrentPlan(plan);
          setAwaitingDestinationPick(false);
          saveTrip(plan, data.collected_state, destinations);
          setTrips(getTrips());
          appendAssistant(data.message);
          toast.success('Your vacation plan is ready!');
          break;
        }

        case 'done':
          setCurrentPlan(data.plan);
          setAwaitingDestinationPick(false);
          appendAssistant(data.message);
          break;

        case 'error':
          toast.error(data.message || 'Something went wrong');
          appendAssistant(data.message || 'An error occurred. Please try again.');
          break;

        default:
          toast.error('Unexpected response from server');
          break;
      }
    },
    [appendAssistant, destinations]
  );

  const handleSend = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || isLoading || awaitingDestinationPick) return;

      if (!conversationStarted) setConversationStarted(true);
      setSidebarOpen(false);

      setMessages((prev) => [...prev, { id: uuidv4(), role: 'user', content: trimmed }]);

      const fetchDests = willFetchDestinations(collectedState);
      setLoadingMode(fetchDests ? 'destinations' : null);
      setIsLoading(true);

      try {
        const data = await sendMessage(sessionId, trimmed, sourceLocation);
        handleApiResponse(data);
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || 'Failed to reach server';
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setLoadingMode(null);
      }
    },
    [
      isLoading,
      awaitingDestinationPick,
      conversationStarted,
      collectedState,
      sessionId,
      sourceLocation,
      handleApiResponse,
    ]
  );

  const handleSelectDestination = useCallback(
    async (chosenDestination, chosenCountry) => {
      if (switching || isLoading) return;

      setSwitching(true);
      setLoadingMode('planning');
      setIsLoading(true);
      setAwaitingDestinationPick(false);

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'user',
          content: `Plan trip to ${chosenDestination}, ${chosenCountry}`,
        },
      ]);

      try {
        const data = await selectDestination(
          sessionId,
          chosenDestination,
          chosenCountry
        );
        if (data.type === 'plan') {
          setCurrentPlan(data.plan);
          setCollectedState(data.collected_state || {});
          saveTrip(data.plan, data.collected_state, destinations);
          setTrips(getTrips());
          appendAssistant(data.message);
          toast.success(`Plan ready for ${chosenDestination}`);
        } else {
          handleApiResponse(data);
          if (data.type === 'error') setAwaitingDestinationPick(true);
        }
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || 'Failed to create plan';
        toast.error(msg);
        setAwaitingDestinationPick(true);
      } finally {
        setIsLoading(false);
        setLoadingMode(null);
        setSwitching(false);
      }
    },
    [sessionId, destinations, switching, isLoading, appendAssistant, handleApiResponse]
  );

  const handleSwitchDestination = useCallback(
    async (chosenDestination, chosenCountry) => {
      if (switching || isLoading) return;

      setSwitching(true);
      setLoadingMode('planning');
      setIsLoading(true);

      try {
        const data = await switchDestination(
          sessionId,
          chosenDestination,
          chosenCountry
        );
        if (data.type === 'plan') {
          setCurrentPlan(data.plan);
          setCollectedState(data.collected_state || {});
          saveTrip(data.plan, data.collected_state, destinations);
          setTrips(getTrips());
          appendAssistant(data.message);
          toast.success(`Switched to ${chosenDestination}`);
        } else {
          handleApiResponse(data);
        }
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || 'Failed to switch destination';
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setLoadingMode(null);
        setSwitching(false);
      }
    },
    [sessionId, destinations, switching, isLoading, appendAssistant, handleApiResponse]
  );

  const handleNewChat = useCallback(async () => {
    try {
      await clearSession(sessionId);
    } catch {
      /* session may not exist */
    }
    resetConversation(true);
    setSidebarOpen(false);
    toast.success('Started a new chat');
  }, [sessionId, resetConversation]);

  const handlePlanAnother = useCallback(async () => {
    try {
      await clearSession(sessionId);
    } catch {
      /* ignore */
    }
    clearSessionStorage();
    resetConversation(true);
    toast.success('Ready to plan a new trip');
  }, [sessionId, resetConversation]);

  const handleSelectTrip = useCallback((trip) => {
    setCurrentPlan(trip.plan);
    setDestinations(trip.destinations || []);
    setCollectedState(trip.state || {});
    setConversationStarted(true);
    setAwaitingDestinationPick(false);
    setSidebarView('chat');
    setSidebarOpen(false);
  }, []);

  const currencyCode = getCurrencyCode(collectedState);
  const currencySymbol = collectedState.currency_symbol || '$';

  const showWelcome = !conversationStarted && !currentPlan;
  const showChatPanel = conversationStarted && !currentPlan;

  return (
    <div className="flex h-full min-h-screen flex-col bg-white">
      <Toaster position="top-center" toastOptions={{ className: 'text-sm' }} />
      <Navbar />

      {!geoLoading && !sourceLocation && conversationStarted && (
        <p className="no-print bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          Location access denied — the assistant may ask which city you&apos;re traveling from.
        </p>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <div
          className={`no-print fixed inset-y-0 left-0 z-50 mt-14 h-[calc(100%-3.5rem)] w-[380px] max-w-[100vw] transform overflow-hidden bg-white shadow-xl transition-transform duration-300 md:static md:z-20 md:mt-0 md:h-auto md:shrink-0 md:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {!conversationStarted ? (
            <OuterSidebar
              onClose={() => setSidebarOpen(false)}
              onNewChat={handleNewChat}
              onSend={handleSend}
              disabled={isLoading}
            />
          ) : (
            <InnerSidebar
              onClose={() => setSidebarOpen(false)}
              onBack={() => {
                if (!messages.length) resetConversation(false);
              }}
              onNewChat={handleNewChat}
              activeView={sidebarView}
              onViewChange={setSidebarView}
              trips={trips}
              onSelectTrip={handleSelectTrip}
              onStartPlanning={() => {
                setSidebarView('chat');
                setSidebarOpen(false);
              }}
              onSend={handleSend}
              isLoading={isLoading || awaitingDestinationPick}
            />
          )}
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="no-print flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-card"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-600">Menu</span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {showWelcome && (
              <WelcomeHero onSearch={handleSend} onCategoryClick={handleSend} disabled={isLoading} />
            )}

            {showChatPanel && (
              <div className="flex min-h-0 flex-1 flex-col px-4 md:px-8">
                <ChatThread messages={messages} isLoading={isLoading} loadingMode={loadingMode} />

                {awaitingDestinationPick && destinations.length > 0 && (
                  <div className="shrink-0 overflow-y-auto border-t border-border py-4">
                    <DestinationCards
                      destinations={destinations}
                      currencySymbol={currencySymbol}
                      currencyCode={currencyCode}
                      onSelect={handleSelectDestination}
                      disabled={isLoading || switching}
                      title="Select a destination"
                      subtitle="Choose one to generate your full vacation plan"
                    />
                  </div>
                )}

                <div className="shrink-0 border-t border-border py-4 md:hidden">
                  <ChatInput
                    onSend={handleSend}
                    disabled={isLoading || awaitingDestinationPick}
                  />
                </div>
              </div>
            )}

            {currentPlan && (
              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                {(isLoading || switching) && (
                  <div className="mb-6">
                    <ChatThread
                      messages={[]}
                      isLoading
                      loadingMode="planning"
                    />
                  </div>
                )}
                <PlanDisplay
                  plan={currentPlan}
                  destinations={destinations}
                  onSwitchDestination={handleSwitchDestination}
                  onPlanAnother={handlePlanAnother}
                  switching={switching}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <section
        id="about"
        className="no-print border-t border-border bg-card px-6 py-8 text-center text-sm text-slate-500"
      >
        <p>
          <strong className="text-primary">VoyageAI</strong> — AI vacation planning. Backend:{' '}
          {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}
        </p>
      </section>
    </div>
  );
}

export default App;
