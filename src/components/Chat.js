import React, { useState, useEffect, useRef } from "react";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import {
  FaPaperPlane,
  FaPlus,
  FaVolumeDown,
  FaVolumeMute,
} from "react-icons/fa";
import * as moment from "moment";
import cookie from "js-cookie";
import useSound from "use-sound";

import styled from "styled-components";
//service
import * as ChatService from "../services/chat-service";
//components
import Button from "./Button";
//Assets
import profileImg from "../Assets/img/profile.png";

import sound from "../Assets/pristine.mp3";

const Chat = () => {
  const [connection, setConnection] = useState(null);
  const [chat, setChat] = useState([]);
  const latestChat = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("None");

  const [currentRoomCode, setCurrentRoomCode] = useState("");
  const [newRoomCode, setNewRoomCode] = useState("");
  const [generationalCode, setGenerationalCode] = useState("");
  const [username, setUsername] = useState("");

  const [doAuth, setDoAuth] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);

  const [message, setMessage] = useState("");
  const [soundNotf, setSoundNotf] = useState(false);

  const [allMessages, setAllMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [take, setTake] = useState(8);

  const [play, { stop }] = useSound(sound, { volume: 0.5 });
  latestChat.current = chat;

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("https://localhost:44327/hubs/operation")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      console.log("conection", "okay");
      setConnectionStatus(connection.connectionState);
      connection
        .start()
        .then((result) => {
          console.log("Connected!");
          loadPrevData();
          setConnectionStatus(connection.connectionState);

          connection.on("ReceiveMessage", (responseMessage) => {
            receiveMessage(responseMessage);
          });
        })
        .catch((e) => console.log("Connection failed: ", e));
    }
  }, [connection]);

  const sendMessage = async () => {
    const chatMessage = {
      message: message,
      userName: username,
      roomCode: currentRoomCode,
    };

    if (connection.connectionStarted) {
      try {
        await connection.invoke("SendMessage", chatMessage).then(() => {
          setMessage("");
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      alert("No connection to server yet.");
    }
  };

  const receiveMessage = (data) => {
    if (soundNotf && data.userName != username) {
      doSound();
    }
    setAllMessages((allMessages) => [data, ...allMessages]);
  };

  const doSound = () => {
    play();
  };

  const loadPrevData = () => {
    if (cookie.get("username")) {
      let username = cookie.get("username");
      setDoAuth(true);
      setUsername(username);

      if (cookie.get("currentRoomCode")) {
        let prevRoomCode = cookie.get("currentRoomCode");
        setCurrentRoomCode(prevRoomCode);
        setNewRoomCode(prevRoomCode);
        joinGroup(prevRoomCode);
      }
    }
  };

  const loadMessage = (requestData) => {
    ChatService.loadMessage(requestData)
      .then((res) => {
        setAllMessages((allMessages) => [...allMessages, ...res.data.list]);
        setTotalCount(res.data.totalCount);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadMoreMessage = () => {
    let requestData = {
      roomCode: currentRoomCode,
      skip: allMessages.length,
      take: take,
    };
    loadMessage(requestData);
  };

  const joinOrLeaveGroup = () => {
    if (!joiningRoom) {
      joinGroup(newRoomCode);
    } else {
      leaveGroup(newRoomCode);
    }
  };

  const joinGroup = (roomCode) => {
    if (roomCode) {
      connection.invoke("AddToGroup", roomCode).then(() => {
        setJoiningRoom(true);
        setCurrentRoomCode(roomCode);
        cookie.set("currentRoomCode", roomCode);
      });

      let requestData = {
        roomCode: roomCode,
        skip: allMessages.length,
        take: take,
      };
      loadMessage(requestData);
    }
  };

  const leaveGroup = (roomCode) => {
    connection.invoke("LeaveGroup", roomCode).then(() => {
      setJoiningRoom(false);
      setCurrentRoomCode("");
      setNewRoomCode("");
      cookie.remove("currentRoomCode");
      setAllMessages([]);
    });
  };

  const generateRoom = () => {
    const rand = Math.floor(Math.random() * (10000 - 1000) + 1000);
    setGenerationalCode(rand);
  };

  const signIn = () => {
    if (!doAuth) {
      setDoAuth(true);
      cookie.set("username", username);
    } else {
      leaveGroup(newRoomCode);
      setDoAuth(false);
      cookie.remove("username");
    }
  };

  return (
    <div>
      <Container>
        <FormWrap>
          <Header>
            <HeaderLogin>
              <div className={"generate-room"}>
                <Button
                  text="Geneare code"
                  color="white"
                  bgColor="#084A62"
                  onClick={generateRoom}
                  style={{ height: "18px", textDecoration: "underline" }}
                />
                <span className={"new-room-code"}>{generationalCode}</span>
              </div>
              <div className={"join-group"}>
                <label htmlFor="text">
                  <input
                    type="text"
                    id="text"
                    name="newRoomCode"
                    required={true}
                    autoComplete="off"
                    disabled={joiningRoom ? joiningRoom : !doAuth}
                    placeholder="Enter room code"
                    value={newRoomCode}
                    onChange={(e) => {
                      setNewRoomCode(e.target.value);
                    }}
                  />
                </label>
                <Button
                  text={joiningRoom ? "Leave group" : "Join room"}
                  color={newRoomCode.length > 3 ? "white" : "black"}
                  bgColor="#084A62"
                  disabled={newRoomCode.length > 3 ? false : !joiningRoom}
                  onClick={joinOrLeaveGroup}
                  style={{ height: "18px", textDecoration: "underline" }}
                />
              </div>
              <div className={"join-group"}>
                <label htmlFor="text">
                  <input
                    type="text"
                    id="text"
                    name="username"
                    autoComplete="off"
                    placeholder="Your name in chat "
                    disabled={doAuth}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <Button
                  text={doAuth ? "Leave chat" : "Join chat"}
                  color={username.length > 3 ? "white" : "black"}
                  bgColor="#084A62"
                  style={{ height: "18px", textDecoration: "underline" }}
                  disabled={username.length > 3 ? false : true}
                  onClick={signIn}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    soundNotf ? stop() : play();
                    setSoundNotf(!soundNotf);
                  }}
                >
                  {soundNotf ? (
                    <FaVolumeDown size={16} />
                  ) : (
                    <FaVolumeMute size={16} />
                  )}
                </button>
              </div>
            </HeaderLogin>
          </Header>
          <FormM>
            <RightSide>
              {totalCount > allMessages.length && joiningRoom ? (
                <div className={"load-more"}>
                  {" "}
                  <Button
                    text="load more"
                    color="white"
                    bgColor={"#2356d8"}
                    onClick={loadMoreMessage}
                    icon={<FaPlus size={16} color="#17a2b8" />}
                  />{" "}
                </div>
              ) : null}

              <MessagesSide>
                {allMessages.map(function (item, i) {
                  if (item.userName == username)
                    return (
                      <div class="container darker">
                        <img src={profileImg} class="right" />
                        <p>{item.message}</p>
                        <span class="time-left">
                          {moment
                            .default(item.createdDate)
                            .format("DD MM YYYY, HH:mm")}
                        </span>
                      </div>
                    );
                  else {
                    return (
                      <div class="container">
                        <img src={profileImg}></img>
                        <span class="sender-name">{item.userName}</span>
                        <p>{item.message}</p>
                        <span class="time-right">
                          {moment
                            .default(item.createdDate)
                            .format("DD MM YYYY, HH:mm")}
                        </span>
                      </div>
                    );
                  }
                })}
              </MessagesSide>
            </RightSide>
          </FormM>
          <SendMessage>
            <div className={"send-message"}>
              <input
                type="text"
                id="text"
                name="message"
                required={true}
                autoComplete="off"
                placeholder="Text"
                onKeyDown={(e) => {
                  if (e.keyCode == 13) {
                    if (joiningRoom & (message.length > 0)) {
                      sendMessage();
                    }
                  }
                }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                text="Send"
                color="white"
                bgColor={
                  joiningRoom & (message.length > 0) ? "#084A62" : "grey"
                }
                disabled={joiningRoom & (message.length > 0) ? false : true}
                onClick={sendMessage}
                icon={<FaPaperPlane size={16} color="#17a2b8" />}
              />
            </div>
          </SendMessage>
          <FooterStatus>
            <label>Connection status : </label> <p>{connectionStatus}</p>
          </FooterStatus>
        </FormWrap>
      </Container>
    </div>
  );
};

export default Chat;

// ================  STYLES ======================
const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const LeftSide = styled.div`
  flex: 1;
  margin-right: 30px;
  height: 400px;
  background-color: #084a62;
`;

const RightSide = styled.div`
  flex: 2;
  margin-left: 30px;
  height: 400px;
  background-color: #084a62;
  .load-more {
    display: flex;
    justify-content: center;
    align-items: center;

    button {
      margin-top: 5px;
      height: 18px;
    }
  }
`;
const MessagesSide = styled.div`
  height: 92%;
  overflow: auto;
  font-size: 10px;
  display: flex;
  flex-direction: column-reverse;

  .container {
    border: 2px solid #dedede;
    background-color: #f1f1f1;
    border-radius: 5px;
    padding: 5px;
    margin: 5px 0;
    border-radius: 10px;
    border-bottom-left-radius: 0;
    margin-left: 5px;
    width: 80%;
  }

  .darker {
    border-color: #ccc;
    background-color: #ddd;
    border-radius: 10px;
    border-bottom-right-radius: 0;
    margin-right: 5px;
    align-self: flex-end;
  }

  .container::after {
    content: "";
    clear: both;
    display: table;
  }

  .container img {
    float: left;
    max-width: 50px;
    width: 100%;
    margin-right: 20px;
    border-radius: 50%;
  }

  .container img.right {
    float: right;
    margin-left: 20px;
    margin-right: 0;
  }

  .time-right {
    float: right;
    color: #aaa;
  }

  .time-left {
    float: left;
    color: #999;
  }

  .sender-name {
    float: right;
    font-style: italic;
    font-size: 14px;
    background-color: lightseagreen;
    border-radius: 5px;
    padding: 5px;
    color: white;
  }
`;

const SendMessage = styled.div`
  margin-top: 5px;
  input[type="text"] {
    width: 40%;
    border-radius: 10px;
    height: 25px;
  }

  .send-message {
    display: flex;
    justify-content: center;
    flex: 5;

    input[type="text"] {
      width: 75%;
    }

    button {
      margin-left: 20px;
    }
  }
  .leave-room {
    flex: 1;
  }
`;

const FormWrap = styled.div`
  width: 800px;
  background-color: white;
  height: 90%;
`;

const FooterStatus = styled.div`
  width: 100%;
  background-color: #5d89fb;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  label {
    font-style: italic;
  }
  p {
    margin-left: 2px;
    color: lightgreen;
    font-weight: 800;
  }
`;

const Header = styled.div`
  padding: 20px;
  height: 40px;
  background-color: #084a62;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    color: white;
  }
`;

const HeaderLogin = styled.div`
  display: flex;
  align-items: center;

  .generate-room {
    border-style: groove;
    padding: 10px;
    margin-right: 10px;
  }

  .join-group {
    border-style: groove;
    margin-right: 10px;
    height: 40px;
    input[type="text"] {
      height: 35px;
    }
    button {
      margin-left: 2px;
    }
  }
  .new-room-code {
    margin-right: 10px;
    width: 40px;
    background-color: white;
    margin-left: 10px;
    border-radius: 6px;
  }
`;

const FormM = styled.form`
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 450px;
`;
