import React, { useEffect, Fragment } from 'react'
import { Col } from 'react-bootstrap';
import { gql, useLazyQuery } from '@apollo/client';

import { useMessageDispatch, useMessageState } from '../../context/messages';
import Message from './Message';

const GET_MESSAGES = gql`
  query getMessages($from: String!) {
    getMessages(from: $from) {
      uuid
      from
      to
      content
      createdAt
    }
  }
`;

export default function Messages() {
  const dispatch = useMessageDispatch();
  const { users } = useMessageState();
  const selectedUser = users?.find(u => u.selected === true);
  const messages = selectedUser?.messages;
  
  // load on demand，點擊左側特定 user 的對話筐，會去取得和此 user 所有的對話
  const [getMessages, { loading: messagesLoading, data: messagesData}] = useLazyQuery(GET_MESSAGES);
  
  useEffect(() => {
    // 一但點擊左側的某位 user 的對話筐，則會觸發 getMessages lazyQuery (傳參數 'from' 給graphql，以取得所有和此 user 有關的 message)
    if(selectedUser && !selectedUser.messages) {
      getMessages({ variables: { from: selectedUser.username }})
    }
  }, [selectedUser]);

  useEffect(() => {
    if(messagesData) {
      dispatch({ type: 'SET_USER_MESSAGES', payload: {
        username: selectedUser.username,
        messages: messagesData.getMessages
      }})
    }
  }, [messagesData]);

  let selectedChatMarkup;
  if(!messages && !messagesLoading) {
    selectedChatMarkup = <p>Select a friend</p>
  } else if(messagesLoading) {
    selectedChatMarkup = <p>Loading...</p>
  } else if(messages.length > 0) {
    selectedChatMarkup = messages.map((message, index) => (
      <Fragment key={message.uuid}>
        <Message message={message} />
        {/* 處理對話筐第一則訊息的 margin top */}
        {index === messages.length - 1 && (
          <div className="invisible">
            <hr className="m-0" />
          </div>
        )}
      </Fragment>
    ))
  } else if(messages.length === 0) {
    selectedChatMarkup = <p>You are now connected! send your first messages </p>
  }

  return (
    <Col xs={10} md={8} className="messages-box d-flex flex-column-reverse">
      {selectedChatMarkup}
    </Col>
  )
}
