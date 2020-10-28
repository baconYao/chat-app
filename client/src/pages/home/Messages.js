import React, { useEffect, useState, Fragment } from 'react'
import { Col, Form } from 'react-bootstrap';
import { useMutation, gql, useLazyQuery } from '@apollo/client';

import { useMessageDispatch, useMessageState } from '../../context/messages';
import Message from './Message';

const SEND_MESSAGE = gql`
  mutation sendMessage($to: String!, $content: String!) {
    sendMessage(to: $to, content: $content) {
      uuid
      from
      to
      content
      createdAt
    }
  }
`;

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
  const [content, setContent] = useState('');

  // load on demand，點擊左側特定 user 的對話筐，會去取得和此 user 所有的對話
  const [getMessages, { loading: messagesLoading, data: messagesData}] = useLazyQuery(GET_MESSAGES);
  
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    onCompleted: data => dispatch({ type: 'ADD_MESSAGE', payload: {
      username: selectedUser.username,
      message: data.sendMessage
    }}),
    onError: err => console.log(err)
  });

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

  const submitMessage = e => {
    e.preventDefault();

    // 沒內容或者沒有選擇要傳送的user時
    if(content.trim() === '' || !selectedUser) return;

    // mutation for sending the message
    sendMessage({ variables: { to: selectedUser.username, content } });
    setContent('');
  }

  let selectedChatMarkup;
  if(!messages && !messagesLoading) {
    selectedChatMarkup = <p className="info-text">Select a friend</p>
  } else if(messagesLoading) {
    selectedChatMarkup = <p className="info-text">Loading...</p>
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
    selectedChatMarkup = <p className="info-text">You are now connected! send your first messages </p>
  }

  return (
    <Col xs={10} md={8}>
      <div className="messages-box d-flex flex-column-reverse">
        {selectedChatMarkup}
      </div>
      <div>
        <Form onSubmit={submitMessage}>
          <Form.Group className="d-flex align-items-center">
            <Form.Control 
              type='text'
              className="message-input p-4 rounded-pill bg-secondary border-0"
              placeholder="Type a message.."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <i className="fas fa-paper-plane fa-2x text-primary ml-2" onClick={submitMessage} role="button"></i>
          </Form.Group>
        </Form>
      </div>
    </Col>
  )
}
