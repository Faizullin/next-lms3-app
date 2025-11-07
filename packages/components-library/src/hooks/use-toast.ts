// import type { ToastActionElement, ToastProps } from "@workspace/ui/components/toast";
// import { useEffect, useState } from "react";

// const TOAST_LIMIT = 1;
// const TOAST_REMOVE_DELAY = 1000000;

// type ToasterToast = ToastProps & {
//   id: string;
//   title?: React.ReactNode;
//   description?: React.ReactNode;
//   action?: ToastActionElement;
// };

// const actionTypes = {
//   ADD_TOAST: "ADD_TOAST",
//   UPDATE_TOAST: "UPDATE_TOAST",
//   DISMISS_TOAST: "DISMISS_TOAST",
//   REMOVE_TOAST: "REMOVE_TOAST",
// } as const;

// let count = 0;

// function genId() {
//   count = (count + 1) % Number.MAX_SAFE_INTEGER;
//   return count.toString();
// }

// type ActionType = typeof actionTypes;

// type Action =
//   | {
//       type: ActionType["ADD_TOAST"];
//       toast: ToasterToast;
//     }
//   | {
//       type: ActionType["UPDATE_TOAST"];
//       toast: Partial<ToasterToast>;
//     }
//   | {
//       type: ActionType["DISMISS_TOAST"];
//       toastId?: ToasterToast["id"];
//     }
//   | {
//       type: ActionType["REMOVE_TOAST"];
//       toastId?: ToasterToast["id"];
//     };

// interface State {
//   toasts: ToasterToast[];
// }

// const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// const addToRemoveQueue = (toastId: string) => {
//   if (toastTimeouts.has(toastId)) {
//     return;
//   }

//   const timeout = setTimeout(() => {
//     toastTimeouts.delete(toastId);
//     dispatch({
//       type: "REMOVE_TOAST",
//       toastId: toastId,
//     });
//   }, TOAST_REMOVE_DELAY);

//   toastTimeouts.set(toastId, timeout);
// };

// export const reducer = (state: State, action: Action): State => {
//   switch (action.type) {
//     case "ADD_TOAST":
//       return {
//         ...state,
//         toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
//       };

//     case "UPDATE_TOAST":
//       return {
//         ...state,
//         toasts: state.toasts.map((t) =>
//           t.id === action.toast.id ? { ...t, ...action.toast } : t
//         ),
//       };

//     case "DISMISS_TOAST": {
//       const { toastId } = action;

//       // ! Side effects ! - This could be extracted into a dismissToast() action,
//       // but I'll keep it here for simplicity
//       if (toastId) {
//         addToRemoveQueue(toastId);
//       } else {
//         state.toasts.forEach((toast) => {
//           addToRemoveQueue(toast.id);
//         });
//       }

//       return {
//         ...state,
//         toasts: state.toasts.map((t) =>
//           t.id === toastId || toastId === undefined
//             ? {
//                 ...t,
//                 open: false,
//               }
//             : t
//         ),
//       };
//     }
//     case "REMOVE_TOAST":
//       if (action.toastId === undefined) {
//         return {
//           ...state,
//           toasts: [],
//         };
//       }
//       return {
//         ...state,
//         toasts: state.toasts.filter((t) => t.id !== action.toastId),
//       };
//   }
// };

// const listeners: ((state: State) => void)[] = [];

// let memoryState: State = { toasts: [] };

// function dispatch(action: Action) {
//   memoryState = reducer(memoryState, action);
//   listeners.forEach((listener) => {
//     listener(memoryState);
//   });
// }

// type Toast = Omit<ToasterToast, "id">;

// function toast({ ...props }: Toast) {
//   const id = genId();

//   const update = (props: ToasterToast) =>
//     dispatch({
//       type: "UPDATE_TOAST",
//       toast: { ...props, id },
//     });
//   const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

//   dispatch({
//     type: "ADD_TOAST",
//     toast: {
//       ...props,
//       id,
//       open: true,
//       onOpenChange: (open: boolean) => {
//         if (!open) dismiss();
//       },
//     },
//   });

//   return {
//     id: id,
//     dismiss,
//     update,
//   };
// }

// function useToast() {
//   const [state, setState] = useState<State>(memoryState);

//   useEffect(() => {
//     listeners.push(setState);
//     return () => {
//       const index = listeners.indexOf(setState);
//       if (index > -1) {
//         listeners.splice(index, 1);
//       }
//     };
//   }, [state]);

//   return {
//     ...state,
//     toast,
//     dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
//   };
// }

// export { toast, useToast };

import { toast as sonnerToast } from "sonner"; // Renamed to avoid conflict

// Type definitions for sonner toast, adjusted to match sonner's API
// Note: sonner's toast does not directly use 'ToastActionElement' or 'ToastProps'
// from shadcn/ui. Instead, it takes 'action' as an object with 'label' and 'onClick'.
// If you were using Shadcn UI's toast components, you'd keep their types,
// but for sonner, we'll align with sonner's simple action structure.
type ToasterToast = {
  id: string; // Sonner handles IDs internally, but we'll keep it for consistency
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: VariantType;
  // Sonner's action type: { label: string; onClick: () => void }
  action?: {
    label: string;
    onClick: () => void;
  };
  // Additional sonner options can be passed here if needed, e.g., duration, type
  duration?: number;
  // For types like 'success', 'error', 'info', 'warning', sonner provides direct methods
  // or you can control through custom components. For simplicity, we'll keep a generic approach
  // and rely on sonner's default `toast()` or specific `toast.success()`, etc.
};

/**
 * A wrapper around sonner's toast function to maintain a similar
 * interface to your original `toast` function.
 */
function toast({
  title,
  description,
  action,
  duration,
  variant,
}: Omit<ToasterToast, "id">) {
  // sonnerToast returns an ID, which can be useful for programmatic dismissal/updates
  const id = getFn(variant || "info")(title, {
    description: description,
    action: action,
    duration: duration,
    // Sonner automatically handles dismissals.
    // The onOpenChange logic is typically not needed as sonner manages visibility.
    // If you need to react to dismissal, you'd use sonner's onDismiss/onAutoClose options.
    // For this migration, we're simplifying.
  });

  return {
    id: String(id), // Sonner's ID can be a number, convert to string for consistency
    // Sonner provides its own methods for dismissing and updating.
    // We'll wrap them to fit your existing `toast` return type.
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: Partial<ToasterToast>) => {
      // sonner's update takes the ID as the first argument, then new content/options
      // const toasts = sonnerToast.getToasts()
      // const toast = toasts.find((t) => t.id === id)
      // if (toast) {
      //   toast
      // }
    },
  };
}

type VariantType = "destructive" | "info";

const getFn = (variant: VariantType) => {
  switch (variant) {
    case "destructive":
      return sonnerToast.error;
    case "info":
      return sonnerToast.info;
    default:
      throw new Error(`Unknown variant: ${variant}`);
  }
};

/**
 * The `useToast` hook now primarily provides the `toast` function
 * and a way to dismiss all toasts. Sonner manages the state internally,
 * so this hook becomes much simpler.
 */
export function useToast() {
  return {
    // We no longer manage a local 'toasts' state since sonner handles rendering
    // and state of all toasts.
    // `toasts: []` is removed because it's managed by sonner.

    toast: toast, // Provide our wrapped toast function
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss(); // Dismiss all if no ID is provided
      }
    },
  };
}
