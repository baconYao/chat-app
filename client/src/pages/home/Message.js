import React, { useState } from 'react';
import classNames from 'classnames';
import { useAuthState } from '../../context/auth';
import moment from 'moment';
import { OverlayTrigger, Tooltip, Button, Popover } from 'react-bootstrap';
import { gql, useMutation } from '@apollo/client';

const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎'];

const REACT_TO_MESSAGE = gql`
  mutation reactToMessage($uuid: String!, $content: String!) {
    reactToMessage(uuid: $uuid, content: $content) {
      uuid content createdAt
    }
  }
`;

export default function Message({ message }) {
  const { user } = useAuthState();
  const sent = message.from === user.username;
  const received = !sent;
  const [ showPopover, setShowPopover ] = useState(false);
  // Get unique icon (不能有多個愛心之類的)
  const reactionIcon = [...new Set(message.reactions.map((r) => r.content))];

  const [reactToMessage] = useMutation(REACT_TO_MESSAGE, {
    onError: err => console.log(err),
    onCompleted: (data) => setShowPopover(false),   // 收合 emoji 的選項匡
  });

  // 處理 reaction 的 function
  const react = (reaction) => {
    // console.log(`Reaction ${reaction} to message: ${message.uuid}`);
    reactToMessage({ variables: { uuid: message.uuid, content: reaction }});
  }

  const reactButton = (
    <OverlayTrigger
      trigger="click"
      placement="top"
      show={showPopover}
      onToggle={setShowPopover}
      transition={false}
      // rootClose 控制 emoji 選項跳出和收合 (點選A對話跳出emoji選項，點選B對話收合A對話的emiji選項，開啟B的emoji選項)
      rootClose
      overlay={
        <Popover className="rounded-pill">
          <Popover.Content className="d-flex px-0 py-0 align-items-center react-button-popover">
            {reactions.map(reaction => (
              <Button className="react-icon-button" variant="link" key={reaction} onClick={() => react(reaction)}>
                {reaction}
              </Button>
            ))}
          </Popover.Content>
        </Popover>
      }
    >
      <Button variant="link" className="px-2">
        <i className="far fa-smile"></i>
      </Button>
    </OverlayTrigger>
  )

  return (
    <div className={ classNames('d-flex my-3', {
      'ml-auto': sent,
      'mr-auto': received
    }) }>
      {/* 送訊息的人，smile icon 顯示在左邊 */}
      {sent && reactButton}
      {/* OverlayTrigger 是在處理顯示每則訊息的顯示時間，hover訊息時，會有 tooltip產生 */}
      <OverlayTrigger
        placement={sent ? 'right' : 'left'}
        overlay={
          <Tooltip>
            {moment(message.createdAt).format('MMMM DD, YYYY @ h:mm a')}
          </Tooltip>
        }
        transition={false}
      >
        <div className={ classNames('py-2 px-3 rounded-pill position-relative', {
          'bg-primary': sent,
          'bg-secondary': received,
        }) }>
          {message.reactions.length > 0 && (
            <div className="reactions-div bg-secondary p-1 rounded-pill">
              {reactionIcon} {message.reactions.length}
            </div>
          )}
          <p className={ classNames({ 'text-white': sent }) } key={message.uuid}>{message.content}</p>  
        </div>
      </OverlayTrigger>
      {/* 送訊息的人，smile icon 顯示在右邊 */}
      {received && reactButton}
    </div>
  )
}
