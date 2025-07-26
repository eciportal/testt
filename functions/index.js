const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function that triggers when a new document is created in the 'announcements' collection.
 * It sends a push notification to all students who have subscribed.
 */
exports.sendAnnouncementNotification = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(async (snap, context) => {
    // Get the data from the new announcement document
    const newAnnouncement = snap.data();

    console.log("New announcement created:", newAnnouncement.title);

    // Get the list of all FCM tokens from the 'fcmTokens' collection
    const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    if (tokens.length === 0) {
      console.log("There are no notification tokens to send to.");
      return null;
    }

    // Construct the notification message payload
    const payload = {
      notification: {
        title: `New Announcement: ${newAnnouncement.title}`,
        body: newAnnouncement.message,
        // This icon will be shown in the notification
        icon: "https://placehold.co/192x192/4f46e5/ffffff?text=E",
      },
      // You can add a 'data' payload to send additional info to your app
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard for web
        page: "announcements" // Custom data to navigate to the right page
      }
    };

    try {
      // Send the notification to all collected tokens
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log("Notifications have been sent successfully.");
      
      // After sending, clean up any tokens that are no longer valid
      await cleanupInvalidTokens(response, tokens);

    } catch (error) {
      console.error("Error sending notifications:", error);
    }
    return null;
  });

/**
 * Cleans up invalid or unregistered FCM tokens from the Firestore database.
 * @param {object} response The response from the admin.messaging().sendToDevice() call.
 * @param {Array<string>} tokens The array of tokens that were targeted.
 */
async function cleanupInvalidTokens(response, tokens) {
  const tokensToDelete = [];
  
  response.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error("Failure sending notification to token:", tokens[index], error);
      
      // Check for error codes indicating an invalid token
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        // Find the document with the invalid token to delete it
        const tokenRef = admin.firestore().collection("fcmTokens").where("token", "==", tokens[index]);
        tokensToDelete.push(tokenRef.get().then(snapshot => snapshot.forEach(doc => doc.ref.delete())));
      }
    }
  });

  // Wait for all delete operations to complete
  await Promise.all(tokensToDelete);
  console.log("Invalid tokens have been cleaned up.");
}
