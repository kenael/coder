import { useTheme } from "@emotion/react";
import TextField from "@mui/material/TextField";
import { deleteWorkspace, startWorkspace, stopWorkspace } from "api/api";
import type { Workspace } from "api/typesGenerated";
import { ConfirmDialog } from "components/Dialogs/ConfirmDialog/ConfirmDialog";
import { displayError } from "components/GlobalSnackbar/utils";
import { type FC, useState } from "react";
import { useMutation } from "react-query";
import { MONOSPACE_FONT_FAMILY } from "theme/constants";

interface UseBatchActionsProps {
  onSuccess: () => Promise<void>;
}

export function useBatchActions(options: UseBatchActionsProps) {
  const { onSuccess } = options;

  const startAllMutation = useMutation({
    mutationFn: async (workspaces: Workspace[]) => {
      return Promise.all(
        workspaces.map((w) =>
          startWorkspace(w.id, w.latest_build.template_version_id),
        ),
      );
    },
    onSuccess,
    onError: () => {
      displayError("Failed to start workspaces");
    },
  });

  const stopAllMutation = useMutation({
    mutationFn: async (workspaces: Workspace[]) => {
      return Promise.all(workspaces.map((w) => stopWorkspace(w.id)));
    },
    onSuccess,
    onError: () => {
      displayError("Failed to stop workspaces");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (workspaces: Workspace[]) => {
      return Promise.all(workspaces.map((w) => deleteWorkspace(w.id)));
    },
    onSuccess,
    onError: () => {
      displayError("Failed to delete workspaces");
    },
  });

  return {
    startAll: startAllMutation.mutateAsync,
    stopAll: stopAllMutation.mutateAsync,
    deleteAll: deleteAllMutation.mutateAsync,
    isLoading:
      startAllMutation.isLoading ||
      stopAllMutation.isLoading ||
      deleteAllMutation.isLoading,
  };
}

type BatchDeleteConfirmationProps = {
  checkedWorkspaces: Workspace[];
  open: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const BatchDeleteConfirmation: FC<BatchDeleteConfirmationProps> = (
  props,
) => {
  const { checkedWorkspaces, open, onClose, onConfirm, isLoading } = props;
  const theme = useTheme();
  const [confirmation, setConfirmation] = useState({ value: "", error: false });

  const confirmDeletion = () => {
    setConfirmation((c) => ({ ...c, error: false }));

    if (confirmation.value !== "DELETE") {
      setConfirmation((c) => ({ ...c, error: true }));
      return;
    }

    onConfirm();
  };

  return (
    <ConfirmDialog
      type="delete"
      open={open}
      confirmLoading={isLoading}
      onConfirm={confirmDeletion}
      onClose={() => {
        onClose();
        setConfirmation({ value: "", error: false });
      }}
      title={`Delete ${checkedWorkspaces?.length} ${
        checkedWorkspaces.length === 1 ? "workspace" : "workspaces"
      }`}
      description={
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            confirmDeletion();
          }}
        >
          <div>
            Deleting these workspaces is irreversible! Are you sure you want to
            proceed? Type{" "}
            <code
              css={{
                fontFamily: MONOSPACE_FONT_FAMILY,
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              `DELETE`
            </code>{" "}
            to confirm.
          </div>
          <TextField
            value={confirmation.value}
            required
            autoFocus
            fullWidth
            inputProps={{
              "aria-label": "Type DELETE to confirm",
            }}
            placeholder="Type DELETE to confirm"
            css={{ marginTop: 16 }}
            onChange={(e) => {
              const value = e.currentTarget?.value;
              setConfirmation((c) => ({ ...c, value }));
            }}
            error={confirmation.error}
            helperText={confirmation.error && "Please type DELETE to confirm"}
          />
        </form>
      }
    />
  );
};
