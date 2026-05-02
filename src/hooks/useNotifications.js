import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import notificationApi from "../api/notification";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  async function sendPushNotification(expoPushToken, title, body, datas) {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data: datas,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  function handleRegistrationError(errorMessage) {
    console.log("Error registering push notifications:", errorMessage);
    throw new Error(errorMessage);
  }

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        handleRegistrationError(
          "Merci de bien vouloir autoriser les notifications pour recevoir les messages de l'application."
        );
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        handleRegistrationError("Project ID not found");
      }
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log("Raw Expo Push Token:", pushTokenString);
        return pushTokenString;
      } catch (e) {
        handleRegistrationError(`${e}`);
      }
    } else {
      handleRegistrationError(
        "Must use physical device for push notifications"
      );
    }
  }

  const registerTokenWithBackend = async (tokenToRegister) => {
    if (!tokenToRegister) return;
    console.log("Attempting to register token with backend:", tokenToRegister);
    try {
      await notificationApi.registerPushToken(tokenToRegister);
      console.log("Successfully registered push token with backend.");
    } catch (error) {
      console.error("Failed to register push token with backend:", error);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        const validToken = token ?? "";
        setExpoPushToken(validToken);
        if (validToken) {
          registerTokenWithBackend(validToken);
        } else {
          console.log(
            "User not authenticated or token invalid, skipping backend registration for now."
          );
        }
      })
      .catch((error) => {
        console.error("Error getting push token:", error);
        setExpoPushToken(`${error}`);
      });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    if (
      expoPushToken &&
      !expoPushToken.includes("Error")
    ) {
      console.log(
        "Auth state changed, re-attempting token registration if needed."
      );
      registerTokenWithBackend(expoPushToken);
    }
  }, [expoPushToken]);

  return { expoPushToken, notification };
}
