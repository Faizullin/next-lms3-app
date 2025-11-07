"use client";

import { useTiptapEditor } from "@workspace/text-editor/tiptap/hooks/use-tiptap-editor";
import { getAvatar } from "@workspace/text-editor/tiptap/lib/tiptap-collab-utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/avatar";
import {
  Button,
  ButtonGroup,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/dropdown-menu";

type User = { clientId: number; id: string; name: string; color: string };

type CollaborationUser = {
  clientId: number;
  name?: string;
  color?: string;
};

interface CollaborationStorage {
  collaborationCaret?: {
    users?: CollaborationUser[];
  };
}

export function CollaborationUsers() {
  const { editor } = useTiptapEditor();

  if (!editor || !editor.storage) {
    return null;
  }

  const storage = editor.storage as CollaborationStorage;
  if (!storage.collaborationCaret) {
    return null;
  }

  const collaborationUsers: User[] =
    storage.collaborationCaret.users?.map((user: CollaborationUser) => ({
      clientId: user.clientId,
      id: String(user.clientId),
      name: user.name || "Anonymous",
      color: user.color || "#000000",
    })) || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-style="ghost"
          data-appearence="subdued"
          style={{ padding: "0.25rem" }}
        >
          <AvatarGroup maxVisible={3}>
            {collaborationUsers.map((user) => (
              <Avatar key={user.id} userColor={user.color}>
                <AvatarImage src={getAvatar(user.name)} />
                <AvatarFallback>
                  {user.name?.toUpperCase()?.[0] || "A"}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Card>
          <CardBody>
            <CardItemGroup>
              <ButtonGroup>
                {collaborationUsers.map((user) => (
                  <DropdownMenuItem key={user.id} asChild>
                    <Button data-style="ghost">
                      <Avatar userColor={user.color}>
                        <AvatarImage src={getAvatar(user.name)} />
                        <AvatarFallback>
                          {user.name?.toUpperCase()?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="tiptap-button-text">{user.name}</span>
                    </Button>
                  </DropdownMenuItem>
                ))}
              </ButtonGroup>
            </CardItemGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
