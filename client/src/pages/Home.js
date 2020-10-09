import React, { Fragment } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';

import { useAuthDispatch } from '../context/auth';

const GET_USERS = gql `
  query getUsers {
    getUsers{
      username email createdAt
    }
  }
`;

export default function Home({ history }) {
  const dispatch = useAuthDispatch();
  // 處理 logout 的邏輯
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    history.push('/login');
  }

  // 進到主頁後，有些資料是需要立即被 Query 的，因此要使用 useQuery
  const {loading, data, error} = useQuery(GET_USERS);
  if (error) {
    console.log(error);
  }

  let usersMarkup;
  if (!data || loading) {
    usersMarkup = <p>Loading...</p>
  } else if(data.getUsers.length === 0) {
    usersMarkup = <p>No users have joined yet.</p>
  } else if(data.getUsers.length > 0) {
    usersMarkup = data.getUsers.map((user) => {
      return (
        <div key={user.username}>
          <p>{user.username}</p>
        </div>
      )
    });
  }

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
        <Col xs={4}>
          {usersMarkup}
        </Col>
        <Col xs={8}>
          <p>Messages</p>
        </Col>
      </Row>

    </Fragment>
  )
}
