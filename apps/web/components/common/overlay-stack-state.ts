export type OverlayStackState = {
  stack: string[];
};

export type OverlayStackEvent = {
  id: string;
  type: 'close' | 'open';
};

export const initialOverlayStackState: OverlayStackState = {
  stack: [],
};

export function overlayStackReducer(
  state: OverlayStackState,
  event: OverlayStackEvent,
): OverlayStackState {
  switch (event.type) {
    case 'open':
      return state.stack.includes(event.id)
        ? state
        : { stack: [...state.stack, event.id] };
    case 'close':
      return state.stack.includes(event.id)
        ? { stack: state.stack.filter((id) => id !== event.id) }
        : state;
  }
}
