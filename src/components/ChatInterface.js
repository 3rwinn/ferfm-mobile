import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import aiApi from "../api/ai";

const ChatInterface = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour je suis #FERMAN, votre assistant virtuel! Comment puis-je vous aider aujourd'hui?",
      sender: "bot",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- State for Animations ---
  const [dots, setDots] = useState(".");
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [fullTypingAnswer, setFullTypingAnswer] = useState(null);
  // ---------------------------

  // Effect for trailing dots animation
  useEffect(() => {
    let dotInterval = null;
    if (isLoading) {
      setDots("."); // Start with one dot immediately
      dotInterval = setInterval(() => {
        setDots((prevDots) => (prevDots.length < 3 ? prevDots + "." : "."));
      }, 400); // Speed for dots cycle
    } else {
      setDots(".");
    }
    return () => {
      if (dotInterval) clearInterval(dotInterval);
    };
  }, [isLoading]);

  // Effect for typing animation
  useEffect(() => {
    let typingInterval = null;
    if (typingMessageId !== null && fullTypingAnswer !== null) {
      let currentTypedLength = 0;
      // Immediately set the first character if the text isn't empty
      if (fullTypingAnswer.length > 0) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === typingMessageId
              ? { ...msg, text: fullTypingAnswer[0] }
              : msg
          )
        );
        currentTypedLength = 1;
      }

      typingInterval = setInterval(() => {
        if (currentTypedLength < fullTypingAnswer.length) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === typingMessageId
                ? {
                    ...msg,
                    text: fullTypingAnswer.substring(0, currentTypedLength + 1),
                  }
                : msg
            )
          );
          currentTypedLength++;
        } else {
          // Typing finished
          if (typingInterval) clearInterval(typingInterval);
          setTypingMessageId(null);
          setFullTypingAnswer(null);
        }
      }, 20); // Typing speed (ms per character)
    }
    return () => {
      if (typingInterval) clearInterval(typingInterval);
      // Ensure typing state is reset if component unmounts mid-typing
      if (typingMessageId !== null) {
        setTypingMessageId(null);
        setFullTypingAnswer(null);
      }
    };
  }, [typingMessageId, fullTypingAnswer]);

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (trimmedInput && !isLoading && typingMessageId === null) {
      const newUserMessage = {
        id: Date.now(),
        text: trimmedInput,
        sender: "user",
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInputText("");
      setIsLoading(true);
      setTypingMessageId(null);
      setFullTypingAnswer(null);

      let botAnswer = null;
      let botMessageId = null;
      let placeholderBotMessageAdded = false;

      try {
        const response = await aiApi.askQuestion(trimmedInput);
        // const response = false;
        if (response.ok) {
          botAnswer = response.data?.answer || "Je n'ai pas compris.";
          botMessageId = Date.now() + 1;
          const placeholderBotMessage = {
            id: botMessageId,
            text: "", // Start with empty text
            sender: "bot",
          };
          // Add placeholder *before* setting isLoading to false
          setMessages((prevMessages) => [
            ...prevMessages,
            placeholderBotMessage,
          ]);
          placeholderBotMessageAdded = true;
        } else {
          const errorBotMessage = {
            id: Date.now() + 1,
            text: "Désolé, une erreur s'est produite.",
            sender: "bot",
          };
          setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
        }
      } catch (error) {
        const errorBotMessage = {
          id: Date.now() + 1,
          text: "Désolé, impossible de contacter l'assistant.",
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
        console.error("AI API error:", error);
      } finally {
        setIsLoading(false); // Stop loading dots
        // Trigger typing effect *after* loading stops
        if (botAnswer && botMessageId && placeholderBotMessageAdded) {
          // Small delay before starting typing for smoother transition
          setTimeout(() => {
            setFullTypingAnswer(botAnswer);
            setTypingMessageId(botMessageId);
          }, 100);
        }
      }
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Calculate header height - adjust if your header height changes
  // const headerHeight = Platform.OS === "ios" ? 75 : 85;
  const headerHeight = Platform.OS === "ios" ? 10 : 10;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle={typingMessageId !== null ? "pageSheet" : undefined}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }} // Make KeyboardAvoidingView take up the full screen
        keyboardVerticalOffset={headerHeight} // Offset for the header on iOS
      >
        <View style={chatStyles.chatContainer}>
          {/* Header */}
          <View style={chatStyles.chatHeader}>
            <View
              style={[
                chatStyles.chatHeaderIcon,
                {
                  marginRight: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  width: "50%",
                  gap: 10,
                },
              ]}
            >
              {/* <Image
                source={require("../../../assets/eco-ia.png")}
                style={chatStyles.chatHeaderIconImage}
              /> */}
              <Text style={chatStyles.chatHeaderText}>#FERMAN</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={chatStyles.closeChatButton}
              disabled={typingMessageId !== null}
            >
              <MaterialCommunityIcons
                name="close"
                size={26}
                color={typingMessageId !== null ? "#999" : "#000"}
              />
            </Pressable>
          </View>

          {/* Message Area */}
          <ScrollView
            ref={scrollViewRef}
            style={chatStyles.messagesArea}
            contentContainerStyle={{ paddingBottom: 10 }} // Add padding to bottom
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  chatStyles.messageBubble,
                  msg.sender === "user"
                    ? chatStyles.userMessage
                    : chatStyles.botMessage,
                  msg.id === typingMessageId && chatStyles.typingBubble,
                ]}
              >
                <Text
                  style={[
                    msg.sender === "user"
                      ? chatStyles.userMessageText
                      : chatStyles.messageText,
                  ]}
                >
                  {msg.text}
                  {msg.id === typingMessageId && (
                    <Text style={chatStyles.cursor}>|</Text>
                  )}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View
                style={[
                  chatStyles.messageBubble,
                  chatStyles.botMessage,
                  chatStyles.loadingBubble,
                ]}
              >
                <Text style={chatStyles.dotsText}>{dots}</Text>
              </View>
            )}
          </ScrollView>

          {/* Suggestion Questions */}
          {!isKeyboardVisible && (
            <View style={{ backgroundColor: "transparent" }}>
              <Text
                style={{
                  fontSize: 14,
                  // fontFamily: typography.fonts.medium,
                  color: "#000",
                  paddingHorizontal: 10,
                  paddingTop: 10,
                }}
              >
                Questions fréquentes
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={chatStyles.suggestionsScrollView}
                contentContainerStyle={chatStyles.suggestionsContainer}
              >
                {[
                  "Comment tu peux m'aider ?",
                  "Quels sont vos services ?",
                  // "Comment fonctionne l'application ?",
                  //   "Comment contacter le support ?",
                  //   "Comment faire un investissement ?",
                ].map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setInputText(item);
                    }}
                    style={chatStyles.suggestionItem}
                  >
                    <Text style={chatStyles.suggestionText}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Area */}
          <View style={chatStyles.inputArea}>
            <TextInput
              style={chatStyles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Entrez votre message..."
              placeholderTextColor="#999"
              onSubmitEditing={handleSend}
              multiline
              editable={!isLoading && typingMessageId === null}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              style={[
                chatStyles.sendButton,
                (isLoading || typingMessageId !== null) &&
                  chatStyles.sendButtonDisabled,
              ]}
              disabled={isLoading || typingMessageId !== null}
            >
              <MaterialCommunityIcons name="arrow-up" size={22} color="white" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const chatStyles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    // backgroundColor: theme.colors.background,
  },
  chatHeaderIcon: {
    width: 34,
    height: 34,
  },
  chatHeaderIconImage: {
    width: 34,
    height: 34,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#eee",
    // backgroundColor: "white",
    backgroundColor: "#FEDA2B",
    // backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === "ios" ? 60 : 15,
  },
  chatHeaderText: {
    fontSize: 18,
    // fontFamily: typography.fonts.bold,
    // color: theme.colors.primary,
    color: "#000",
    fontWeight: "bold",
  },
  closeChatButton: {
    padding: 5,
  },
  messagesArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  userMessage: {
    backgroundColor: "#FEDA2B",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    minWidth: 60,
  },
  loadingBubble: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  dotsText: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
    lineHeight: 24,
  },
  messageText: {
    fontSize: 14,
    // color: "#333",
    color: "#000",
    // fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },
  userMessageText: {
    fontSize: 14,
    // fontFamily: typography.fonts.regular,
    color: "#000",
    lineHeight: 20,
  },
  cursor: {
    color: "#FEDA2B",
    fontWeight: "bold",
    fontSize: 16,
    opacity: 0.8, // Make cursor slightly transparent
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginRight: 10,
    fontSize: 14,
    // fontFamily: typography.fonts.regular,
  },
  sendButton: {
    backgroundColor: "#FEDA2B",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#999",
  },
  suggestionsScrollView: {
    maxHeight: 60,
    // backgroundColor: "red",
    // borderTopWidth: 1,
    // borderTopColor: '#eee',
    // backgroundColor: 'white',
    backgroundColor: "transparent",
  },
  suggestionsContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  suggestionItem: {
    // backgroundColor: '#f0f0f0',
    // backgroundColor: theme.colors.primary,
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    // height: 60,
    height: 40,
  },
  suggestionText: {
    // color: theme.colors.white,
    color: "#000",
    fontSize: 14,
    // fontFamily: "Poppins-Regular",
  },
});

export default ChatInterface;
