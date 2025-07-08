import React from 'react';
import { DragDropContext as OriginalDragDropContext, Droppable as OriginalDroppable, Draggable as OriginalDraggable } from 'react-beautiful-dnd';

// Suppress the defaultProps warning for react-beautiful-dnd components
// This is a temporary workaround until the library is updated

const originalError = console.error;
const suppressedWarnings = ['defaultProps'];

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    const isWarning = message.includes('Warning:');
    const isSuppressed = suppressedWarnings.some(warning => message.includes(warning));
    
    if (isWarning && isSuppressed) {
      return;
    }
  }
  originalError.apply(console, args);
};

// Re-export the components
export const DragDropContext = OriginalDragDropContext;
export const Droppable = OriginalDroppable;
export const Draggable = OriginalDraggable;