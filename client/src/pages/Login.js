import React, { useState } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap';
import { gql, useLazyQuery } from '@apollo/client';
import { Link } from 'react-router-dom';

import { useAuthDispatch } from '../context/auth';

const LOGIN_USER = gql`
  query login(
    $username: String!
    $password: String!
  ) {
    login(
      username: $username
      password: $password
    ) {
      username
      email
      createdAt
      token
    }
  }
`;

export default function Login(props) {
  const [variables, setVariables] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  
  const dispatch = useAuthDispatch();

  // useLazyQuery 是 load on demain
  // useQuery 是component載入後，會自動去 fetch 資料，取得 news feed、文章之類的適用
  const [loginUser, { loading }] = useLazyQuery(LOGIN_USER, {
    onError: (err) => setErrors(err.graphQLErrors[0].extensions.errors),
    onCompleted: (data) => {
      // 登入完成後，處理 token
      dispatch({ type: 'LOGIN', payload: data.login });
      props.history.push('/');
    }
  });

  const submitLoginForm = (event) => {
    event.preventDefault();

    // console.log(variables);
    // 傳參數給 grqphql (參數包含 login 需要的 username 和 password)
    loginUser({ variables })
  }

  return (
    <Row className="bg-white py-5 justify-content-center">
      <Col sm={8} md={6} lg={4}>
        <h1 className="text-center">
          Login
        </h1>
        <Form onSubmit={submitLoginForm}>
          <Form.Group>
            <Form.Label className={errors.username && 'text-danger'}>
              { errors.username ?? 'Username' }
            </Form.Label>
            <Form.Control
              type="text"
              value={variables.username}
              className={errors.username && 'is-invalid'}
              onChange={e => setVariables({ ...variables, username: e.target.value})} 
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className={errors.password && 'text-danger'}>
              { errors.password ?? 'Password' }
            </Form.Label>
            <Form.Control
              type="password"
              value={variables.password}
              className={errors.password && 'is-invalid'}
              onChange={e => setVariables({ ...variables, password: e.target.value})} 
            />
          </Form.Group>
          <div className="text-center">
            <Button variant="success" type="submit" disabled={loading}>
              { loading ? 'loading..' : 'Login' }
            </Button>
            <br />
            <small>Don't have an account? <Link to="/register">Register</Link></small>
          </div>
        </Form>
      </Col>
    </Row>
  )
}
