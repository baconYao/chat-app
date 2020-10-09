import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuthState } from '../context/auth';

export default function DynamicRoute(props) {
  const { user } = useAuthState();
  if(props.authenticated && !user) {
    // 路由需要被保護，但 context state 的 user 是 null (表示沒登入)
    return <Redirect to="/login" />
  } else if(props.guest && user) {
    return <Redirect to="/" />
  } else {
    return <Route component={props.component} {...props} />
  }
}