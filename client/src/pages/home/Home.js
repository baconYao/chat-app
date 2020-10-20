import React, { Fragment, useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { gql, useLazyQuery } from '@apollo/client';

import { useAuthDispatch } from '../../context/auth';

import Users from './Users';

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

export default function Home({ history }) {
  const dispatch = useAuthDispatch();
  const [selectedUser, setSelectedUser] = useState(null);
  // 處理 logout 的邏輯
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    history.push('/login');
  }


  
  // load on demand，點擊左側特定 user 的對話筐，會去取得和此 user 所有的對話
  const [getMessages, { loading: messagesLoading, data: messagesData}] = useLazyQuery(GET_MESSAGES);

  useEffect(() => {
    // 一但點擊左側的某位 user 的對話筐，則會觸發 getMessages lazyQuery (傳參數 'from' 給graphql，以取得所有和此 user 有關的 message)
    if(selectedUser) {
      getMessages({ variables: { from: selectedUser }})
    }
  }, [selectedUser]);

  // 若有某位 user 的所有對話，則 console log 出來 (此處的 getMessages 是要和 typeDefs.js 內 Query 的 getMessages 相同)
  // if(messagesData) console.log(messagesData.getMessages);

  

  return (
    <Fragment>
      <Row className="bg-white justify-content-around mb-1">
        <Link to="/login">
          <Button variant="link">Login</Button>
        </Link>
        <Link to="/register">
          <Button variant="link">Register</Button>
        </Link>
        <Button variant="link" onClick={logout}>Logout</Button>
      </Row>

      <Row className="bg-white">
        <Users setSelectedUser={setSelectedUser} selectedUser={selectedUser}/>
        <Col xs={8}>
          {messagesData && messagesData.getMessages.length > 0 ? (
            messagesData.getMessages.map(message => (
              <p key={message.uuid}>{message.content}</p>
            ))
          ): <p>Messages</p>}
        </Col>
      </Row>

    </Fragment>
  )
}
