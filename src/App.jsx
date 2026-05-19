import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";

import {
  deleteVote as deleteVoteRequest,
  getItems,
  getMatches,
  getResults,
  login as loginRequest,
  vote as voteRequest,
} from "./api.js";
import BottomNav from "./components/BottomNav.jsx";
import EndOfDeck from "./components/EndOfDeck.jsx";
import Login from "./components/Login.jsx";
import MatchesView from "./components/MatchesView.jsx";
import ResultsView from "./components/ResultsView.jsx";
import SwipeCard from "./components/SwipeCard.jsx";
import "./styles.css";

const STORAGE_KEY = "aniswipeUser";
const BACKGROUND_CREDIT_URL =
  "https://www.publicdomainpictures.net/en/view-image.php?image=511609&picture=anime-city";
const BACKGROUND_CREDIT_TEXT = "Background: Anime City by Hay Lyo (CC0)";
const PAGE_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16, ease: "easeOut" },
};

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function App() {
  const [user, setUser] = useState(loadStoredUser);
  const [activeTab, setActiveTab] = useState("swipe");
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [votePending, setVotePending] = useState(false);
  const [undoPending, setUndoPending] = useState(false);
  const [lastVote, setLastVote] = useState(null);
  const [cardStartedAt, setCardStartedAt] = useState(Date.now());

  const unvotedItems = useMemo(
    () => items.filter((item) => item.userVote === null),
    [items]
  );
  const currentItem = unvotedItems[0] || null;
  const votedCount = items.length - unvotedItems.length;

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    async function loadItems() {
      setItemsLoading(true);
      setItemsError("");

      try {
        const data = await getItems(user.userId);

        if (!ignore) {
          setItems(data.items || []);
          setLastVote(null);
        }
      } catch (err) {
        if (!ignore) {
          setItemsError(err.message);
        }
      } finally {
        if (!ignore) {
          setItemsLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    setCardStartedAt(Date.now());
    setVoteError("");
  }, [currentItem?.itemId]);

  async function handleLogin(username) {
    const loggedInUser = await loginRequest(username);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setActiveTab("swipe");
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setItems([]);
    setLastVote(null);
    setActiveTab("swipe");
  }

  async function handleVote(choice, itemId = currentItem?.itemId) {
    if (!user || !currentItem || !itemId || votePending || undoPending) {
      return false;
    }

    setVotePending(true);
    setVoteError("");

    const decisionMs = Date.now() - cardStartedAt;
    const votedItem = items.find((item) => item.itemId === itemId);

    try {
      await voteRequest({
        userId: user.userId,
        itemId,
        choice,
        decisionMs,
      });

      setItems((previousItems) =>
        previousItems.map((item) =>
          item.itemId === itemId ? { ...item, userVote: choice } : item
        )
      );
      setLastVote({
        itemId,
        choice,
        title: votedItem?.title || "Previous anime",
      });

      return true;
    } catch (err) {
      setVoteError(err.message);
      return false;
    } finally {
      setVotePending(false);
    }
  }

  async function handleUndoLastVote() {
    if (!user || !lastVote || undoPending) {
      return;
    }

    setUndoPending(true);
    setVoteError("");

    try {
      await deleteVoteRequest({
        userId: user.userId,
        itemId: lastVote.itemId,
      });

      setItems((previousItems) =>
        previousItems.map((item) =>
          item.itemId === lastVote.itemId ? { ...item, userVote: null } : item
        )
      );
      setLastVote(null);
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setUndoPending(false);
    }
  }

  if (!user) {
    return (
      <Login
        backgroundCreditText={BACKGROUND_CREDIT_TEXT}
        backgroundCreditUrl={BACKGROUND_CREDIT_URL}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AniSwipe</p>
          <h1>{activeTab === "swipe" ? "Swipe" : activeTab}</h1>
        </div>
        <div className="user-box">
          <span>@{user.username}</span>
          <button className="text-button" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "swipe" && (
            <motion.section
              className="swipe-view"
              key="swipe"
              aria-live="polite"
              {...PAGE_FADE}
            >
              {itemsLoading && <div className="panel-state">Loading anime...</div>}

              {!itemsLoading && itemsError && (
                <div className="panel-state error-state">{itemsError}</div>
              )}

              {!itemsLoading && !itemsError && currentItem && (
                <SwipeCard
                  key={currentItem.itemId}
                  item={currentItem}
                  progressCurrent={votedCount + 1}
                  progressTotal={items.length}
                  onVote={handleVote}
                  pending={votePending || undoPending}
                />
              )}

              {!itemsLoading && !itemsError && !currentItem && (
                <EndOfDeck total={items.length} />
              )}

              {!itemsLoading && !itemsError && lastVote && (
                <div className="undo-panel">
                  <div>
                    <span>Last swipe</span>
                    <strong>
                      {lastVote.choice === "yes" ? "Watch" : "Skip"} ·{" "}
                      {lastVote.title}
                    </strong>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={undoPending || votePending}
                    onClick={handleUndoLastVote}
                    type="button"
                  >
                    {undoPending ? "Undoing..." : "Undo"}
                  </button>
                </div>
              )}

              {voteError && <p className="inline-error">{voteError}</p>}
            </motion.section>
          )}

          {activeTab === "results" && (
            <motion.div key="results" {...PAGE_FADE}>
              <ResultsView fetchResults={getResults} />
            </motion.div>
          )}

          {activeTab === "matches" && (
            <motion.div key="matches" {...PAGE_FADE}>
              <MatchesView userId={user.userId} fetchMatches={getMatches} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      <a
        className="background-credit app-credit"
        href={BACKGROUND_CREDIT_URL}
        rel="noreferrer"
        target="_blank"
      >
        {BACKGROUND_CREDIT_TEXT}
      </a>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
