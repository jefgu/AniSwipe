import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
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
    setActiveTab("swipe");
  }

  async function handleVote(choice, itemId = currentItem?.itemId) {
    if (!user || !currentItem || !itemId || votePending) {
      return;
    }

    setVotePending(true);
    setVoteError("");

    const decisionMs = Date.now() - cardStartedAt;

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
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setVotePending(false);
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
        {activeTab === "swipe" && (
          <section className="swipe-view" aria-live="polite">
            {itemsLoading && <div className="panel-state">Loading anime...</div>}

            {!itemsLoading && itemsError && (
              <div className="panel-state error-state">{itemsError}</div>
            )}

            {!itemsLoading && !itemsError && currentItem && (
              <SwipeCard
                item={currentItem}
                progressCurrent={votedCount + 1}
                progressTotal={items.length}
                onVote={handleVote}
                pending={votePending}
              />
            )}

            {!itemsLoading && !itemsError && !currentItem && (
              <EndOfDeck total={items.length} />
            )}

            {voteError && <p className="inline-error">{voteError}</p>}
          </section>
        )}

        {activeTab === "results" && <ResultsView fetchResults={getResults} />}

        {activeTab === "matches" && (
          <MatchesView userId={user.userId} fetchMatches={getMatches} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
