import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/shared/Navbar';
import WelcomeHero from './components/shared/WelcomeHero';
import ClaudeSidebar from './components/sidebar/ClaudeSidebar';
import ChatThread from './components/chat/ChatThread';
import ChatInput from './components/chat/ChatInput';
import PlanDisplay from './components/plan/PlanDisplay';
import DestinationCards from './components/plan/DestinationCards';
import TripsPage from './components/pages/TripsPage';
import AboutPage from './components/pages/AboutPage';
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
  clearSessionStorage,
  getRecentTrips,
  saveCompletedTrip,
  removeRecentTrip,
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [recents, setRecents] = useState(() => getRecentTrips());
  const [activePage, setActivePage] = useState('chat'); // chat | trips | about
  const [composerText, setComposerText] = useState('');

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
    setActivePage('chat');
  }, []);

  const appendAssistant = useCallback((content, isFollowUp = false) => {
    setMessages((prev) => [
      ...prev,
      { id: uuidv4(), role: 'assistant', content, isFollowUp },
    ]);
  }, []);

  const persistCompleted = useCallback(
    ({ plan, state, destinations: dests, assistantMessage }) => {
      const planned_at = new Date().toISOString();
      const category = state?.category || '';
      const currency_symbol = state?.currency_symbol || plan?.currency_symbol || '$';
      const duration_days = state?.trip_duration_days ?? plan?.duration_days ?? null;
      const destination = plan?.destination || state?.destination_preference || 'Trip';
      const country = plan?.country || state?.destination_country || '';
      const budget = state?.budget ?? null;

      const fullMessages = [
        ...messages,
        ...(assistantMessage
          ? [{ id: uuidv4(), role: 'assistant', content: assistantMessage }]
          : []),
      ];

      saveCompletedTrip({
        session_id: sessionId,
        destination,
        country,
        category,
        budget,
        currency_symbol,
        duration_days,
        planned_at,
        messages: fullMessages,
        plan,
        state,
        destinations: dests || [],
      });
      setRecents(getRecentTrips());
    },
    [messages, sessionId]
  );

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
          appendAssistant(data.message);
          persistCompleted({
            plan,
            state: data.collected_state || {},
            destinations,
            assistantMessage: data.message,
          });
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
    [appendAssistant, destinations, persistCompleted]
  );

  const handleSend = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || isLoading || awaitingDestinationPick) return;

      if (!conversationStarted) setConversationStarted(true);
      setSidebarOpen(false);
      setActivePage('chat');
      setComposerText('');

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
          appendAssistant(data.message);
          persistCompleted({
            plan: data.plan,
            state: data.collected_state || {},
            destinations,
            assistantMessage: data.message,
          });
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
    [
      sessionId,
      destinations,
      switching,
      isLoading,
      appendAssistant,
      handleApiResponse,
      persistCompleted,
    ]
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
          appendAssistant(data.message);
          persistCompleted({
            plan: data.plan,
            state: data.collected_state || {},
            destinations,
            assistantMessage: data.message,
          });
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
    [
      sessionId,
      destinations,
      switching,
      isLoading,
      appendAssistant,
      handleApiResponse,
      persistCompleted,
    ]
  );

  const handleNewChat = useCallback(async () => {
    try {
      await clearSession(sessionId);
    } catch {
      /* session may not exist */
    }
    resetConversation(true);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    setActivePage('chat');
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

  const handleSelectRecent = useCallback((trip) => {
    if (!trip) return;
    if (trip.session_id) {
      setSessionId(trip.session_id);
      saveSessionId(trip.session_id);
    }
    setMessages(Array.isArray(trip.messages) ? trip.messages : []);
    setCurrentPlan(trip.plan || null);
    setDestinations(trip.destinations || []);
    setCollectedState(trip.state || {});
    setConversationStarted(true);
    setAwaitingDestinationPick(false);
    setActivePage('chat');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleDeleteRecent = useCallback((trip) => {
    const next = removeRecentTrip(trip?.session_id);
    setRecents(next);
  }, []);

  const currencyCode = getCurrencyCode(collectedState);
  const currencySymbol = collectedState.currency_symbol || '$';

  const showWelcome = !conversationStarted && !currentPlan;

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-white">
      <Toaster position="top-center" toastOptions={{ className: 'text-sm' }} />
      <Navbar
        onAbout={() => setActivePage('about')}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />

      {!geoLoading && !sourceLocation && conversationStarted && (
        <p className="no-print bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          Location access denied — the assistant may ask which city you&apos;re traveling from.
        </p>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <ClaudeSidebar
          isOpen={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSearch={() => {}}
          onMyTrips={() => {
            setActivePage('trips');
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          recents={recents}
          onSelectRecent={handleSelectRecent}
          onDeleteRecent={handleDeleteRecent}
          activeRecentSessionId={sessionId}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-white">
          <AnimatePresence mode="wait">
            {activePage === 'about' && (
              <div key="about" className="min-h-0 flex-1 overflow-y-auto">
                <AboutPage
                  onStartPlanning={() => {
                    setActivePage('chat');
                    setSidebarOpen(false);
                  }}
                />
              </div>
            )}

            {activePage === 'trips' && (
              <div key="trips" className="min-h-0 flex-1">
                <TripsPage
                  onPlanAnotherTrip={handlePlanAnother}
                  onLoadTrip={(t) => {
                    setCollectedState(t.state || {});
                    setCurrentPlan(t.plan || null);
                    setDestinations([]);
                    setMessages([
                      { id: uuidv4(), role: 'assistant', content: `Loaded trip plan for ${t.destination}.` },
                    ]);
                    setConversationStarted(true);
                    setAwaitingDestinationPick(false);
                    setActivePage('chat');
                  }}
                />
              </div>
            )}

            {activePage === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {showWelcome ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center px-4">
                      <div className="w-full max-w-2xl">
                        <WelcomeHero
                          onCategoryClick={(cat) =>
                            setComposerText(`I want a ${cat.toLowerCase()} vacation`)
                          }
                          disabled={isLoading}
                        />
                        <div className="mt-6">
                          <ChatInput
                            size="lg"
                            onSend={handleSend}
                            disabled={isLoading}
                            placeholder="Describe your ideal trip..."
                            value={composerText}
                            onChange={setComposerText}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
                        <div className="mx-auto w-full max-w-[800px]">
                          <ChatThread messages={messages} isLoading={isLoading} loadingMode={loadingMode} />

                          {awaitingDestinationPick && destinations.length > 0 && (
                            <div className="mt-4">
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

                          {currentPlan && (
                            <div className="mt-8">
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
                      </div>

                      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-white/95 p-4 backdrop-blur">
                        <div className="mx-auto w-full max-w-[800px]">
                          <ChatInput
                            onSend={handleSend}
                            disabled={isLoading || awaitingDestinationPick || !!currentPlan}
                            disabledText={
                              isLoading 
                                ? 'Planning your trip...' 
                                : currentPlan 
                                  ? 'Plan complete — start a new chat to plan another trip' 
                                  : undefined
                            }
                            placeholder="Describe your ideal trip..."
                            value={composerText}
                            onChange={setComposerText}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
