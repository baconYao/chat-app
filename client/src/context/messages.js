import React, { createContext, useReducer, useContext } from 'react';

const MessageStateContext = createContext();
const MessageDispatchContext = createContext();

const messageReducer = (state, action) => {
  let usersCopy;
  switch(action.type) {
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      }
    case 'SET_USER_MESSAGES':
      const { username, messages } = action.payload;
      usersCopy = [...state.users];
      const userIndex = usersCopy.findIndex(u => u.username === username);
      usersCopy[userIndex] = { ...usersCopy[userIndex], messages };
      return {
        ...state,
        users: usersCopy
      }
    case 'SET_SELECTED_USER':
      // 負責處理點選左側對話筐的任意 User 時，此 User 的 selected 被標記為 true，其餘 user 標記為 false
      usersCopy = state.users.map(user => ({
        ...user,
        selected: user.username === action.payload
      }))
      return {
        ...state,
        users: usersCopy
      }
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, { users: null });
  return (
    <MessageDispatchContext.Provider value={dispatch}>
      <MessageStateContext.Provider value={state}>
        {children}
      </MessageStateContext.Provider>
    </MessageDispatchContext.Provider>
  )
}

export const useMessageState = () => useContext(MessageStateContext);
export const useMessageDispatch = () => useContext(MessageDispatchContext);