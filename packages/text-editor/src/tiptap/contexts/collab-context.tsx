"use client";

import * as React from "react";
import { Doc as YDoc } from "yjs";
import {
  fetchCollabToken,
  getUrlParam,
  TIPTAP_COLLAB_DOC_PREFIX,
  TIPTAP_COLLAB_APP_ID,
} from "@workspace/text-editor/tiptap/lib/tiptap-collab-utils";

type MinimalCollabProvider = {
  destroy: () => void;
};

export type CollabContextValue = {
  provider: MinimalCollabProvider | null;
  ydoc: YDoc;
  hasCollab: boolean;
};

export const CollabContext = React.createContext<CollabContextValue>({
  hasCollab: false,
  provider: null,
  ydoc: new YDoc(),
});

export const CollabConsumer = CollabContext.Consumer;
export const useCollab = (): CollabContextValue => {
  const context = React.useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within an CollabProvider");
  }
  return context;
};

export const useCollaboration = (room: string) => {
  const [provider, setProvider] = React.useState<MinimalCollabProvider | null>(
    null,
  );
  const [collabToken, setCollabToken] = React.useState<string | null>(null);
  const [hasCollab, setHasCollab] = React.useState<boolean>(false);
  const ydoc = React.useMemo(() => new YDoc(), []);

  React.useEffect(() => {
    const enableCollabParam = getUrlParam("enableCollab");
    setHasCollab(parseInt(enableCollabParam || "0") === 1);
  }, []);

  React.useEffect(() => {
    if (!hasCollab) return;

    const getToken = async () => {
      const token = await fetchCollabToken();
      setCollabToken(token);
    };

    getToken();
  }, [hasCollab]);

  React.useEffect(() => {
    if (!hasCollab || !collabToken) return;

    const docPrefix = TIPTAP_COLLAB_DOC_PREFIX;
    const documentName = room ? `${docPrefix}${room}` : docPrefix;
    const appId = TIPTAP_COLLAB_APP_ID;

    // Collab provider not available; create a no-op provider to keep context shape stable
    const noopProvider: MinimalCollabProvider = {
      destroy: () => {},
    };

    setProvider(noopProvider);

    return () => {
      noopProvider.destroy();
    };
  }, [collabToken, ydoc, room, hasCollab]);

  return { provider, ydoc, hasCollab };
};

export function CollabProvider({
  children,
  room,
}: Readonly<{
  children: React.ReactNode;
  room: string;
}>) {
  const { hasCollab, provider, ydoc } = useCollaboration(room);

  const value = React.useMemo<CollabContextValue>(
    () => ({
      hasCollab,
      provider,
      ydoc,
    }),
    [hasCollab, provider, ydoc],
  );

  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  );
}
