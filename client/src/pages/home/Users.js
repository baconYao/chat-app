import React from 'react'
import { Col, Image } from 'react-bootstrap';
import classNames from 'classnames';
import { gql, useQuery } from '@apollo/client';

import { useMessageDispatch, useMessageState } from '../../context/messages';

const GET_USERS = gql `
  query getUsers {
    getUsers{
      username
      imageUrl
      createdAt
      latestMessage {
        uuid
        from
        to
        content
        createdAt
      }
    }
  }
`;

export default function Users() {
  const dispatch = useMessageDispatch();
  const { users } = useMessageState();
  const selectedUser = users?.find(u => u.selected === true)?.username;

  // 進到主頁後，有些資料是需要立即被 Query 的，因此要使用 useQuery
  const {loading} = useQuery(GET_USERS, {
    // 取得所有的 users 後，塞進 message context 內
    onCompleted: data => dispatch({ type: 'SET_USERS', payload: data.getUsers }),
    onError: err => console.log(err),
  });

  // 聊天室側邊欄位的顯示樣式
  let usersMarkup;
  if (!users || loading) {
    usersMarkup = <p>Loading...</p>
  } else if(users.length === 0) {
    usersMarkup = <p>No users have joined yet.</p>
  } else if(users.length > 0) {
    usersMarkup = users.map((user) => {
      // 當點選左側 user 的訊息列，記住被點選過的狀態
      const selected = selectedUser === user.username;
      return (
        <div
          role="button"
          // 利用 classNames，若此 user 被記為 selected (true)，則加上 'bg-white' 這個 class
          className={classNames("user-div d-flex justify-content-md-start justify-content-center p-3", {'bg-white': selected})}
          key={user.username}
          onClick={() => dispatch({ type: 'SET_SELECTED_USER', payload: user.username })}
        >
          {/* 有照片則顯示照片，沒有的話顯示預設的圖片 */}
          <Image
            src={user.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
            className="user-image"
          />
          <div className="d-none d-md-block ml-2">
            <p className="text-success">{user.username}</p>
            <p className="font-weight-light">
              {user.latestMessage ? user.latestMessage.content : "You are now connected!" }
            </p>
          </div>
        </div>
      )
    });
  }

  return (
    <Col xs={2} md={4} className="p-0 bg-secondary">
      {usersMarkup}
    </Col>
  )
}
